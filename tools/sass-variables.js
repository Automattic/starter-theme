/**
 * Sass CSS4 Variables
 *
 * Converts Sass variables with a given prefix into CSS4 variables.
 */

require( 'colors' );

const minimist = require( 'minimist' );

const { basename, dirname, resolve } = require( 'path' );
const { existsSync, readFileSync, writeFileSync } = require( 'fs' );

const CWD=process.cwd();

let IGNORE_IMPORTS, VAR_PREFIX;
let VAR_PREFIX_REGEX, VAR_INTERPOLATION_REGEX;

class SassVariablesCLI {

	constructor() {
		const opts = minimist( process.argv.slice( 2 ), {
			boolean: [ 'skip-root' ],
			string: [ 'prefix', 'ignore', 'root-selector', 'output' ],
			alias: {
				'skip-root':     's',
				'prefix':        'p',
				'ignore':        'i',
				'root-selector': 'r',
				'output':        'o',
			}
		});
		const prefix = opts.prefix || 'x';
		const ignore = ( opts.ignore || '' ).toString().split( /,+/ ).filter( x => x ).concat( ['bourbon', 'susy'] );
		const rootSelector = opts[ 'root-selector' ] || ':root';
		const noRoot = opts[ 'skip-root' ] || false;
		const outFile = opts.output || null;
		const force = opts.force || false;
		const args = opts._;
		
		if ( 1 == args.length ) {
			const file = args[0];
			const options = { prefix, ignore, rootSelector, noRoot, outFile, file, force };
			this.check( file, options );
			this.prepare( options );
			this.run( file, options );
		} else {
			this.usage();
		}
	}
	
	prepare( opts ) {
		const { prefix, ignore } = opts;
		IGNORE_IMPORTS=ignore;
		VAR_PREFIX = `${prefix}-`;
		VAR_PREFIX_REGEX = new RegExp( `^\\$${VAR_PREFIX}` );
		VAR_INTERPOLATION_REGEX = new RegExp( `#\\s*{\s*\\$${VAR_PREFIX}([a-z0-9-_]+)\s*}`, 'g' );
	}

	check( file, options ) {
		const { outFile } = options;
		if ( ! existsSync( file ) ) {
			console.log( 'File does not exist: %s', file );
			process.exit( 1 );
		}
		if ( outFile === file ) {
			throw new Error( `Input file and output file are the same: ${file}`.red );
		}
		if ( existsSync( outFile ) && ! options.force ) {
			throw new Error( `Output file exists: ${outFile}. Use '--force' to overwrite.`.red );
		}
	}
	
	switchToFileDir( file ) {
		process.chdir( resolve( CWD, dirname( file ) ) );
	}
	
	run( file, options ) {
		const buf = readFileSync( file, 'utf8' ).trim();
		this.switchToFileDir( file ); // Switch to file directory after reading.
		const sass = new SassImportsResolver( buf ).toString();
		const processed = new SassVariableResolver( sass, options ).toString();
	}

	usage() {
		const script = basename( __filename );
		console.log( 'Usage: %s <sass-file>', script );
		console.log( 'Usage: %s -s|--skip-root <sass-file>', script );
		console.log( 'Usage: %s -p|--prefix=<prefix> <sass-file>', script );
		console.log( 'Usage: %s -i|--ignore=<file1,file2,...> <sass-file>', script );
		console.log( 'Usage: %s -r|--root-selector=<selector> <sass-file>', script );
		console.log( 'Usage: %s -o|--output <out-file>', script );
		process.exit( 1 );
	}

}

class SassImportsResolver {
	
	constructor( buf, path='' ) {
		const self = this;
		this.buffer = buf.trim().split( "\n" ).map( line => {
			return self.processLine( line, path );
		} ).join( "\n" ) + "\n";
	}
	
	toString() {
		return this.buffer;
	}
	
	isIgnoredImport( target ) {
		return IGNORE_IMPORTS.indexOf( target ) >= 0;
	}
	
	processLine( line, path ) {
		const matches = line.match( /^\s*@import\s*['"]([^'"]+)['"]\s*;/ );
		if ( matches ) {
			let file, target = matches[1];
			if ( '' !== path ) {
				target = `${path}/${target}`;
			}
			if ( ! this.isIgnoredImport( target ) ) {
				if ( target.indexOf( '/' ) >= 0 ) {
					const parts = target.split( '/' );
					const last = parts.pop();
					file = `${ parts.join( '/' ) }/_${ last }.scss`;
				} else {
					file = `_${ target }.scss`
				}
				if ( existsSync( file ) ) {
					const path = dirname( file ).replace( /^\.$/, '' );
					const buf = readFileSync( file, 'utf8' );
					const sass = new SassImportsResolver( buf, path );
					return sass.toString();
				} else {
					throw new Error( `Bad Import: ${ line } (Use --ignore to ignore this import)`.red );
				}
			}
		}
		return line;
	}
	
}

class SassVariableResolver {
	
	constructor( buf, options ) {
		let sass = buf;
		const spec = this.getSpec( buf );
		const { outFile } = options;
		sass = this.addMediaQueryVariables( sass, spec );
		sass = this.addFallbacks( sass, spec );
		sass = this.insertRoot( sass, spec, options );
		if ( outFile ) {
			process.chdir( CWD ); // Switch back to current working directory.
			writeFileSync( outFile, sass, 'utf8' );
		} else {
			console.log( sass );
		}
	}
	
	addMediaQueryVariables( buf, spec ) {
		const self = this;
		return buf.replace( /\(\s*([a-z0-9-]+)\s*:\s*([^\)]+)\s*\)/g, (match, prop, val ) => {
			val = self.replaceInterpolatedVariables( val );
			val = self.replaceRawVariables( val, spec );
			return `(${prop}: ${val})`;
		} );
	}
	
	addFallbacks( buf, spec ) {
		let self = this;
		return this.addPropertyFallbacks( buf, spec, x => {
			x = self.replaceInterpolatedVariables(x);
			x = self.replaceRawVariables(x, spec);
			return x;
		} );
	}
	
	replaceRawVariables( val, spec ) {
		const self = this, keys = Object.keys( spec ).sort( (a, b) => a.length - b.length ).reverse(); // Sort by string length.
		return keys.reduce( ( str, k ) => {
			const v = self.sassToCSSVar( k );
			while ( str.indexOf( k ) >= 0 ) {
				str = str.replace( k, `var(${v})` );
			}
			return str;
		}, val );
	}
	
	addPropertyFallbacks( buf, spec, filter ) {
		const self = this;
		return buf.replace( /(;|{|\s*)(:|::)?(\$)?([a-z0-9-_]+)\s*:\s*(.+)(\s*)(;?|})/g, (match, before='', colon='', varPrefix='', property, value, whiteSpace='', end ) => {
			if ( '$' === varPrefix ) {
				return match;
			} else {
				const filteredValue = filter( value, spec );
				if ( filteredValue !== value ) {
					const filteredMatch = match.replace( /^(;|{)\s*/, '' ).replace( /(;?|})/, '' ).replace( /;\s*$/, '' ).trimRight() + ';';
					const matchEndWs = /;\s*$/.test(match) ? (match.split( ';' ).pop() || '' ) : '';
					const repl = `${before}${filteredMatch}${matchEndWs}${before.replace(/[^\s]+/,'')}${colon}${varPrefix}${property}: ${filteredValue}${whiteSpace}${end}`;
					return repl;
				} else {
					return match;
				}
			}
		} );
	}

	renderRoot( spec, options ) {
		if ( options.noRoot ) {
			return '';
		} else {
			const self = this;
			const rootBlock = Object.keys( spec ).reduce( ( acc, key ) => {
				const prop = self.sassToCSSVar( key );
				const val = self.replaceInterpolatedVariables( spec[ key ] );
				acc.push( `  ${prop}: ${val};` );
				return acc;
			}, []).join( "\n" );
			return `${options.rootSelector} {\n${rootBlock}\n}`;
		}
	}

	insertRoot( sass, spec, options ) {
		const rootBlock = this.renderRoot( spec, options );
		const rootRegex = /:root\s*{\s*}/;
		if ( rootRegex.test( sass ) ) {
			return sass.replace( /:root\s*{\s*}/, rootBlock );
		} else if ( options.noRoot ) {
			return sass;
		} else {
			console.error( '\nNeed to specify an empty `:root {}` on your CSS, ideally located after your variables are declared.\n\nUse `--skip-root` to ignore this error.\n'.red );
			throw new Error( `${"stopping".bold}: no root specified on '${options.file}'`.red );
		}
	}

	sassToCSSVar( x ) {
		return x.replace( VAR_PREFIX_REGEX, '--' );
	}

	replaceInterpolatedVariables( buf ) {
		return buf.replace( VAR_INTERPOLATION_REGEX, 'var(--$1)' );
	}

	getSpec( buf ) {
		const prefix = `$${VAR_PREFIX}`;
		return buf.match( /(\$[a-z0-9_-]+)\s*:\s*([^;]+);/g ).filter( line => {
			return 0 === line.indexOf( prefix );
		} ).reduce( ( ob, line ) => {
			const [ prop, value ] = line.replace( /\s*;$/, '' ).split( /\s*:\s*/ );
			ob[ prop ] = value;
			return ob;
		}, {});
	}
	
}

new SassVariablesCLI;