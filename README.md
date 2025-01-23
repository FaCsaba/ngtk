# Neographers' Toolkit
NGTK let's you create your own writing system!
---

Neographers' Toolkit is my Computer Science final year project at the University of Debrecen.

## Architecture

![A diagram showing the architecture of ngtk. At the bottom is a box titled "Agent" with the description: "Platform agnostically renders the specified font, acts as an input method editor". From that an arrow points to a box with a dashed outline titled "Agent Interface". From that two arrows, one pointing to the box titled "Web App" with the description: "Creates glyphs, specifies keyboard layout, and previews with an embedded agent", the other one points to the box titled "Desktop App", with description: "Thin layer over the cross-platform implementation of the agent".](docs/imgs/ngtk_architecture.png "Architecture")

- Web App
    - A web application written in typescript for users to be able to create their own glyphs in an svg editor.
    - Users can assign a keyboard key to a glyph or assign words to a glyph.
    - Users can also preview their creation in an online version of the desktop application.
- Desktop App
    - A platform specific implementation driving the agent through it's interface.
- Agent
    - Platform agnostically renders the specified font, acts as an input method editor.

## Attributions
- [react-desinger](https://github.com/react-designer/react-designer): used for editing of svgs

## Planned features
- [ ] An easy to use online editor
- [ ] An online preview of the desktop application where you can try out the writing system
- [ ] A Desktop application like an IME