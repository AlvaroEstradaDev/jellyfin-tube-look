<h1 align="center">TubeLook</h1>
<h2 align="center">A Jellyfin Plugin</h2>
<p align="center">
	<img alt="Logo" src="logo.png" />
	<br />
	<br />
	<a href="https://github.com/AlvaroEstradaDev/jellyfin-tube-look/?tab=License-1-ov-file">
		<img alt="DBAD" src="https://img.shields.io/badge/license-DBAD-blue" />
	</a>
	<a href="https://github.com/AlvaroEstradaDev/jellyfin-tube-look/releases">
		<img alt="Current Release" src="https://img.shields.io/github/release/AlvaroEstradaDev/jellyfin-tube-look.svg" />
	</a>
</p>

## Reporting Issues

If you face issues relating to the visuals or behaviour of the YouTube-style video player, please report them on the GitHub repository. This plugin integrates directly into Jellyfin's web client and adds specialized styling without permanently altering core files.

## Installation

### Prerequisites
- Jellyfin Version `10.11.3` or greater

### Installation
1. Add the plugin manifest file URL to your Jellyfin repositories.
2. Install `TubeLook` from the Catalogue.
3. Restart Jellyfin.
4. Ensure your server loads the new plugins. Clear your browser cache or force refresh the page.

## Upcoming Features/Known Issues
If you find an issue with any of the sections or usage of the plugin, please open an issue on GitHub.

### FAQ

#### I've updated Jellyfin to latest version but I can't see the plugin available in the catalogue
The likelihood is the plugin hasn't been updated for that version of Jellyfin and the plugins are strictly compatible. Please wait until an update has been pushed. 

#### I've installed the plugin and the UI changes don't appear. How do I fix?
This is common, particularly on a fresh install. The first thing you should try is the following:
1. Launch your browser's developer tools
2. Open the **Network** tab
3. Check the **Disable cache** checkbox
4. Refresh the page **while the dev tools are still open**

## Credits
This plugin takes visual inspiration from modern video apps like YouTube.

The repository structure, formatting, and license approach are heavily inspired by and adapted from:
> MakD (2025). *Jellyfin-Media-Bar* [Source code]. GitHub. https://github.com/IAmParadox27/jellyfin-plugin-media-bar
