# Privacy Policy Web - GitHub Pages

This folder contains a standalone privacy policy website that can be deployed to GitHub Pages.

## Files

- `index.html` - Main privacy policy page
- `styles.css` - Styling for the privacy policy page
- `README.md` - This file

## GitHub Pages Deployment

### Option 1: Using the `docs` folder (Recommended)

1. Rename this folder to `docs`:
   ```bash
   mv privacy-policy-web docs
   ```

2. In your GitHub repository settings:
   - Go to Settings → Pages
   - Under "Source", select "Deploy from a branch"
   - Select "main" (or your default branch) and `/docs` folder
   - Click Save

3. Your privacy policy will be available at:
   `https://[username].github.io/UW-Tracker/`

### Option 2: Using a separate branch

1. Create and switch to a new branch:
   ```bash
   git checkout -b gh-pages
   ```

2. Move the contents of `privacy-policy-web` to the root of this branch:
   ```bash
   git mv privacy-policy-web/* .
   git mv privacy-policy-web/.* . 2>/dev/null || true
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "Add privacy policy for GitHub Pages"
   git push origin gh-pages
   ```

4. In GitHub repository settings:
   - Go to Settings → Pages
   - Under "Source", select "Deploy from a branch"
   - Select "gh-pages" branch and `/ (root)` folder
   - Click Save

5. Your privacy policy will be available at:
   `https://[username].github.io/UW-Tracker/`

### Option 3: Using GitHub Actions (Advanced)

You can set up a GitHub Actions workflow to automatically deploy this folder to GitHub Pages. This is useful if you want to keep the privacy policy in a separate folder but still deploy it automatically.

## Customization

### Update Contact Information

Edit `index.html` and update the contact information in section 10:
- Email address
- Physical address (if applicable)

### Update Last Updated Date

The last updated date is automatically set to the current date when the page loads. To set a specific date, edit the JavaScript at the bottom of `index.html`:

```javascript
const lastUpdated = 'January 1, 2024'; // Set your specific date
document.getElementById('lastUpdated').textContent = lastUpdated;
```

### Customize Styling

Edit `styles.css` to customize:
- Colors (update CSS variables in `:root`)
- Fonts
- Spacing
- Layout

## Testing Locally

You can test the privacy policy page locally by opening `index.html` in a web browser, or by using a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000

# Then open http://localhost:8000 in your browser
```

## Notes

- The privacy policy is a template and should be reviewed and customized to match your actual data collection and usage practices.
- Consult with legal counsel to ensure compliance with applicable privacy laws (GDPR, CCPA, etc.).
- Update the privacy policy whenever your data practices change.

