# STEMM Archives

Separated from the original single-file `.dc.html` prototype into three files:

```
stemm-archives/
├── index.html      ← markup only, no inline styles or JS
├── styles.css      ← all CSS (animations, layout, components, states)
├── app.js          ← all interactive logic (routing, password, bubbles, modal)
└── uploads/        ← drop your image assets here (see table below)
    ├── pw_bg.png
    ├── wrong.png
    ├── bros_side.png
    ├── cooldown_img.png
    ├── correct_img.png
    ├── main_bg.png
    ├── pink_bg.png
    ├── tab_dk.png
    ├── tab_yk.png
    ├── tab_fk.png
    └── folder_front.png
```

## Image placeholders

All image `src` values in `app.js` (the `IMAGES` object at the top) are placeholder
paths. Replace each one with the real filename from the original upload bundle:

| Placeholder path          | Original filename from bundle                    |
|---------------------------|--------------------------------------------------|
| `uploads/pw_bg.png`       | `pw_bg-1782231527331.png`                        |
| `uploads/wrong.png`       | `wrong_gif-1782231905332.png`                    |
| `uploads/bros_side.png`   | `bros_side-1782231539883.png`                    |
| `uploads/cooldown_img.png`| `cooldown_img-1782231553556.png`                 |
| `uploads/correct_img.png` | `correct_img-1782231574124.png`                  |
| `uploads/main_bg.png`     | `main_bg-1782231595892.png`                      |
| `uploads/pink_bg.png`     | `pink_bg-1782231579657.png`                      |
| `uploads/tab_dk.png`      | `tab_dk.png`                                     |
| `uploads/tab_yk.png`      | `tab_yk.png`                                     |
| `uploads/tab_fk.png`      | `tab_fk.png`                                     |
| `uploads/folder_front.png`| `folder_front.png`                               |

## Configuration

In `app.js`, find these constants near the top and update as needed:

```js
// Supabase Edge Function (leave blank to use the in-page password fallback)
const SUPABASE = { url: '', anonKey: '', fnName: 'verify-password' };

// Fallback password used when SUPABASE.url is empty
const DEMO_PASSWORD = 'hayamaxxing';

// Lockout settings
const COOLDOWN_MINUTES = 5;
const MAX_ATTEMPTS     = 3;
```

## Screens / routing

| `view` state | Screen shown         | Notes                              |
|-------------|----------------------|------------------------------------|
| `main`      | Green folder page    | Default on load                    |
| `password`  | Password entry       | Reached via Incognito button       |
| `cool`      | Pink sisters page    | Reached after correct password     |
| `DK` `YK` `FK` | Tab placeholders | From main folder tabs              |
| `MQ` `SI`   | Tab placeholders     | From cool page tabs                |

Navigation uses `go(view)` in `app.js`, which handles the slide-up animation,
screen switching, and scroll reset.
