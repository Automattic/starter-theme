
# Starter Theme

This is a theme development boilerplate.

For detailed usage information, refer to the [documentation](docs/).

## Usage

Start by cloning the repository:

```bash
git clone git@github.com:Automattic/starter-theme.git
```

Initialize the project with:

```bash
npm install && npm run build:all
```

To listen for changes and automatically compile Sass assets:

```bash
npm run grunt:dev
```

To build the final theme deliverable, including *RTL styles* and *CSS Variables*:

```bash
npm run build:theme
```

The generated theme will be available in **build/starter-theme.zip**.