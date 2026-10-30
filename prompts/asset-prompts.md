# Red Clay Open -- generation log

Source art: tennis serve illustration by Omar Saeed (user-supplied, found on Pinterest).
All jobs run through the Higgsfield REST API (`execution/hf_generate.py`), prepaid USD balance.
Every job is also appended to `gen/hf_log.jsonl` (model, arguments, request id, urls).

## Plate
`work/plate_magenta.png` -- 1350x1800 (3:4). Player cut out of the reference with Apple Vision
(`execution/cutout_subject.swift --all --full`), ball added back as a fitted circle (Vision missed it),
edges eroded 2 px and refilled from the interior to drop the red fringe, placed bottom-aligned on
flat #FF00FF so the clips can be keyed (magenta never appears in the character).

## Clips (MiniMax H3 image-to-video, 2K, 5 s, $0.065/s list = ~$0.33 per clip)
### hero_loop_a
start = end = plate_magenta.png

> Locked-off static camera, no camera movement. Flat solid magenta studio background that stays perfectly uniform. The stylized 3D tennis player holds his serve toss pose: the tennis ball hangs in the air just above his huge open hand and drifts gently up and down while slowly spinning, he breathes calmly with his chest rising and falling, his eyes follow the ball, his fingers flex slightly, the racket sways a little behind his head. Slow, subtle, seamless idle loop. Same character design, same matte clay-like 3D illustration style with fine grain, same soft warm lighting.

### serve_a
start = plate_magenta.png, no end frame

> Locked-off static camera, no camera movement, low angle. Flat solid magenta studio background that stays perfectly uniform. The stylized 3D tennis player hits his serve: his knees bend, the racket drops behind his back, he explodes upward and strikes the falling tennis ball at full stretch high above his head, the ball rockets straight toward the camera, then his racket follows through down across his body and he lands on his front foot. Fast powerful athletic motion. Same character design, same matte clay-like 3D illustration style with fine grain, same soft warm lighting.

## Centre Court still (Grok Imagine 2.0, image edit from the reference, 2k 16:9)

> Same art style as the reference image: matte clay-like stylized 3D illustration with soft warm light and fine film grain, the same character design. A wide cinematic view of a red clay tennis court at golden hour, camera low behind the near baseline. The same tennis player from the reference (white t-shirt, black shorts, dark cap, long cylindrical limbs, oversized hands, white wristband) stands at the near baseline on the right with his back three-quarters to us, racket drawn back for a forehand. A second stylized player in a cream shirt and dark shorts waits at the far baseline beyond the net. An orange tennis ball floats above the net. Terracotta clay court with crisp white lines and a black net, steep crimson stands packed with tiny simplified spectators on both sides, a huge low red sun disc above the far stands. Limited palette of crimson, terracotta, cream, black and orange. No text, no logos, no watermark.

### centre_rally_a
H3 i2v, start = end = gen/centre_still_a.png

> Locked-off static camera, no camera movement. Matte clay-like stylized 3D illustration, same style and lighting throughout. A rally on the red clay court: the near player on the right swings his forehand and hits the orange ball, the ball flies low over the net, the far player shuffles and returns it with a forehand, the ball floats back over the net toward the near player, who resets into exactly the same ready position as at the start with his racket drawn back. The crowd in the crimson stands sways and turns their heads to follow the ball. The big red sun stays still. Smooth, natural sports motion, seamless loop.

