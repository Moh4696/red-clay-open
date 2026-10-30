# Prompt: Red Clay Open

**How this was built:** Claude Opus 5.5, 26 October 2026. It was given a 3D tennis-serve illustration by [Omar Saeed](https://www.linkedin.com/in/omarsaeed2) (from his 3D Sports Illustrations series) and the Higgsfield REST API, with a budget to spend carefully; the generation cost about $1.05. The exact image and video prompts that were run are in [`prompts/asset-prompts.md`](prompts/asset-prompts.md). The artwork and the motion derived from it remain Omar Saeed's.

## Prompt to recreate it

Attach the serve illustration (a stylized, matte clay-like 3D tennis player mid-toss: white t-shirt, black shorts, dark cap, long limbs, oversized hands, on a red background) and give the model an image-to-video tool (MiniMax H3 through Higgsfield here).

```text
Build "Red Clay Open 2027", a scroll landing page for a fictional clay-court tennis tournament, around the attached 3D serve illustration. It is plain HTML, CSS and JavaScript with no build step, using Lenis for smooth scrolling and three.js for one 3D object. State clearly that the tournament is fictional, the dates (17–23 May 2027), venue and ticket tiers are placeholders, and nothing is sold. Credit the illustrator.

THE IDEA
The illustration freezes the toss half a second before the hit. The page plays the rest of that serve as you scroll: the ball leaves the strings and flies at the camera, the page dives into it, and the ball then follows you down the page. It bounces through the week's schedule and sets into a red disc at the bottom like a sun.

ASSETS
1. Cut the player out of the illustration, put the ball back if the cut-out loses it, and place him on a flat magenta (#FF00FF) plate. Magenta never appears in the character, so it keys cleanly.
2. Image-to-video, locked-off camera, same character and style:
   a) a seamless idle loop: the ball hovers above his hand and spins, he breathes, his eyes follow the ball. Use the same first and last frame.
   b) the full serve: knees bend, racket drops, he strikes the ball, which rockets toward the camera, then follows through and lands.
   c) a Centre Court still made by editing the reference in the same style: red clay court at golden hour, crimson stands, a huge low red sun. Then a seamless rally loop from that still.
3. Key every frame against its own backdrop colour, because the model drifts magenta toward pink, and unmix the edge pixels so the outline stays clean over both red and cream.
4. Ship the idle loop as a plain H.264 file with the colour on top and the matte below, recombined by a small WebGL shader, so transparency works in Safari. Ship the serve as about 79 keyed WebP frames drawn to a canvas as you scroll, then a CSS dolly into the ball as it fills the frame.

SECTIONS
- Hero, "The serve": the looping idle player. Scrolling plays the serve and dives into the ball.
- Numbers: the tournament at a glance.
- The week, "Seven days, one draw.": the schedule (Opening Days, The Business End, Final Day). A real-time three.js felt tennis ball, with a procedural felt texture and a seam traced on the sphere, bounces down through it.
- Serve anatomy, "Under a second, six moments.": the serve broken into six phases.
- Centre Court, "Five thousand seats. None of them far.": the rally loop.
- Tickets, "Pick your days.": placeholder tiers.
- Footer, "See you on clay.": the ball sets into a red sun disc.

LOOK
Crimson, terracotta, cream and black, with fine grain. Fonts: Big Shoulders Display for headlines, Instrument Serif for accents, Inter Tight for text. Make it responsive, and respect prefers-reduced-motion.

Before generating anything, propose the concept and the exact generation prompts with their costs, and keep spending low. Check the scroll sequence, the keying edges and Safari transparency in a real browser.
```

## Original prompt

> hey, create a 3D animated landing with this ref image as the hero. i want the hero to be moving in screen, and we scroll down we have more interesting motion assert. I'd give you access to higgsfield but first tell me what you have in mind

Then, after the concept options:

> you know what let's build it for a tournament. omar saeed on pinterest. but let's use higgsfield API. i have credit there but spend wisely.

(Typos lightly fixed.)
