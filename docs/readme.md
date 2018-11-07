# Starter Theme: Documentation

This is a starter theme project, used to create an actual theme.

After you clone the repository, run the following command to get started:

```bash
npm install && npm run -s build:all
```

This will build the theme and everything you need to start working.


## Development Workflow

SASS is **automatically compiled** for you when running `npm run grunt:dev`

Whenever you change a Sass file, the `style.css` and `editor.css` files will automatically be generated and updated, as you make changes to their source  counterparts.

## CSS Variables

The CSS Variables will be automatically generated when building the theme.

To map a Sass variable into a CSS Variable, all that needs to be done is to add a prefix to the variable. For this project, is `$x-`, e.g. `$x-font-family-base`.

Any Sass variable that has that prefix, will automatically be converted into a CSS Variable, that can be later used to customize the theme.

## RTL Styles

These are automatically generated when building the theme. There is no manual work involved in creating these, other than testing to make sure things look presentable.

## Post Processing

**RTL Styles** and **CSS Variables** are NOT generated when running `grunt:dev`.
This is because they are generated as post processing steps, during the actual build process.

At a certain point during development, you may want to debug and test the CSS Variables or RTL Styles. These can be built by running:

```bash
npm run -s build:all
```

⚠️ If you make changes to the source stylesheets afterwards, you must run `build:all` once again, to get the RTL and CSS Variable styles generated.

## Building the Theme

To build the theme, all you need to do is run:

```bash
npm run -s build:theme
```

The theme and ZIP will be created in the **build/** directory.

_By default, the filename for the theme will be **starter-theme.zip**.
The build system uses the "name" property from **package.json**._

## Excluding files from build

During the build process, the files are copied with [rsync](https://en.wikipedia.org/wiki/Rsync), using an opt-out mechanism. This means everything is copied, unless excluded.

To specify which files to exclude, use the **excludes.rsync** file.

## Build Manifest

When the theme is built, an integrity check is performed against the built theme, to make sure every file contained in the theme, should be there.

You can control **exactly** which files should go into the final theme, by editing the **manifest.json** file.

The build manifest can be edited manually, or by using the *build tool*. For example, to add a 404.php file to your project:

```bash
node tools/buildtool.js --add 404.php
```

This will automatically update the **manifest.json** file.

## Build Integrity Check

If you get a **"Files not in build"** list of files is presented when the build fails, this means these files are not in the build manifest and should be added.

If a **"Missing from build"** list of files is presented when the build fails, this means these files are specified in the build manifest, but are missing from the actual theme files in the build.
