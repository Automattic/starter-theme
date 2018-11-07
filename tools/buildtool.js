
var fs = require('fs');
var path = require('path');
var fileMod = require('file');
var minimist = require('minimist');
var colors = require('colors');
var _ = require('underscore');

var CWD = path.resolve(__dirname, '../');

if (process.cwd() !== CWD) {
	console.log('Must run from root directory');
	process.exit(1);
}

function main() {
	var args = minimist(process.argv.slice(2));
	if (args.check) {
		checkBuild(args.path);
	} else if (args.add) {
		var files = [args.add].concat(args._); // To retain order
		if (args.add === true || files.length === 0) {
			console.log('No files to add');
			process.exit(1);
		} else {
			addFiles(files); // Idempotent operation
		}
	} else {
		var f = path.basename(__filename);
		console.log('\n\
%s:\n\n\
%s --check\n\
%s --check --path path\n\
%s --add file1 file2\n', "Usage".bold, f, f, f);
		process.exit(1);
	}
}

function checkBuild(p) {
	var files = walkDir(path.resolve(CWD, p || 'build'));
	var spec = getBuildSpec();
	var invalid = _.difference(files, spec.files);  // Files not in manifest
	var missing = _.difference(spec.files, files);  // Files missing from manifest
	if (invalid.concat(missing).length === 0) {
		process.exit(0); // Clean exit
	} else {
		if (invalid.length) {
			console.log('\nFiles not in build:'.bold);
			console.log('\n* %s'.red, invalid.join('\n* ').red);
		}
		if (missing.length) {
			console.log('\nMissing from build:'.bold);
			console.log('\n* %s'.red, missing.join('\n* ').red);
		}
		console.log('');
		process.exit(1); // Exit with error
	}
}

function addFiles(files) {
	var json, spec = getBuildSpec();
	files = files.map(function(file) {
		file = path.resolve(CWD, file);
		file = path.relative(CWD, file);
		return file;
	});
	json = JSON.stringify({
		files: _.uniq(files.concat(spec.files).sort()) // Ensure unique values
	}, null, "  ");
	fs.writeFileSync(spec.path, json, 'utf8');
}

function getBuildSpec() {
	var json = path.resolve(CWD, 'manifest.json');
	return {
		path: json,
		files:	JSON.parse(fs.readFileSync(json, 'utf8')).files
	}
}

function walkDir(targetDir) {
	var out = [], multiSlashes = /[\/]+/g;
	fileMod.walkSync(targetDir, function(dirPath, dirs, files) {
		out = files.reduce(function(state, file) {
			state.push((dirPath + '/' + file).replace(multiSlashes, '/'));
			return state;
		}, out).sort();
	});
	var len = targetDir.length;
	return out.map(function(file) {
		return file.slice(len + 1);
	}).sort();
}

module.exports = main();