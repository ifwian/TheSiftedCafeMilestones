# Milestone 2: HTML and CSS only

The public page built with **only HTML and CSS**. It looks finished, but nothing "does" anything yet.

## How to open it

Double-click `index.html` (it opens in your browser). Or in VS Code install the **Live Server** extension, right-click `index.html`, *Open with Live Server*. No Node, no MySQL, no internet needed (the Google Fonts need internet; without it a fallback font shows).

## What is new in this milestone

- `index.html`: the whole public page (header, hero + reservation form, About, Featured menu, Gallery, Visit us, footer)
- `css/style.css`: the styles (shared and website parts)
- `assets/`: logo and photos

## What to show your professor (demo steps)

1. Scroll the page: every section from the original design is there.
2. Make the browser window narrow (or press F12 and use the phone icon): the layout changes for tablet and phone.
3. Press Tab: you can see which element has the keyboard focus. The first Tab reveals a "Skip to main content" link.
4. Open `css/style.css`: colors are CSS variables at the top (`--blue`, `--red`...). Change one and refresh to show how the theme is controlled.
5. Click **Send reservation request** with an empty form: the browser itself blocks it (HTML5 `required`, `type="email"`, `min`/`max`). This is built-in validation, no JavaScript.

## What is NOT done yet (say this openly)

- The form sends nothing. (If every field is valid, the browser just reloads the page.)
- The phone menu button does not open the navigation (needs JavaScript, Milestone 3).
- Gallery photos do not open bigger (Milestone 3).
- The Time list shows every hour from 9:00 AM to 9:00 PM. Showing only the times of the chosen branch (Calamba from 10 AM, Cabuyao from 9 AM) needs JavaScript (Milestone 3).
- No staff pages, no server, no database.

## What to say (talking points)

- We used semantic HTML: `header`, `nav`, `main`, `section`, `footer`, `form`, with a `label` for every field.
- One CSS file. Colors and spacing are variables, so the whole theme can change from one place.
- Layout uses Flexbox and Grid, and media queries for tablet and phone.
- We kept the original brand: colors, fonts (Fraunces and Inter), photos and section order.

## Questions your professor may ask

**What is the difference between HTML and CSS?**
HTML is the structure and content (headings, form, images). CSS is how it looks (colors, spacing, layout).

**What does `required` do on an input?**
The browser refuses to submit until the field is filled. It is quick, but anyone can bypass it, so the server must check again later (Milestone 5).

**What is a media query?**
A CSS rule that applies only at certain screen widths, for example `@media (max-width: 560px)` for phones.

## Honest note

AI (Claude) helped build this project. Be ready to explain every file in this milestone in your own words.
