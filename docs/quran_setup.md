# Quran Mushaf Setup Guide

## Overview

This app uses the `react-native-quran-hafs` package to display the Holy Quran in traditional mushaf format with authentic Arabic fonts. This requires proper font configuration and server setup.

## Requirements

The package requires the following fonts to be hosted on a server:
- **QCF_BSML** font family (604 font files, one for each page of the Quran)
- These fonts are specially designed to display Quranic text in the Hafs recitation style

## Setup Instructions

### 1. Download Quran Fonts

Download the QCF (Quran Computer Font) files from one of these sources:

- **Official Source**: [Quran.com Font Repository](https://github.com/quran/quran-data)
- **Alternative**: Search for "QCF_BSML Quran fonts" or "Quran Computer Fonts"

**IMPORTANT**: The font extension must be `.ttf` (lowercase), not `.TTF` (uppercase). Rename all font files if needed:

```bash
# On Mac/Linux:
for file in *.TTF; do mv "$file" "${file%.TTF}.ttf"; done

# On Windows PowerShell:
Get-ChildItem -Filter *.TTF | Rename-Item -NewName { $_.Name -replace '.TTF','.ttf' }
```

### 2. Host Fonts on Your Server

Upload all font files to your web server. The recommended structure is:

```
your-domain.com/
  └── fonts/
      ├── QCF_P001.ttf
      ├── QCF_P002.ttf
      ├── QCF_P003.ttf
      ├── ...
      └── QCF_P604.ttf
```

Your server must:
- Support **HTTPS** (required for production apps)
- Have **CORS enabled** to allow font downloads from your React Native app
- Be reliable and fast (CDN recommended for better performance)

#### Server Options

1. **Self-hosted** (Apache, Nginx, etc.)
2. **Cloud Storage**:
   - AWS S3 with CloudFront
   - Google Cloud Storage
   - Azure Blob Storage
3. **Static Hosting**:
   - Vercel
   - Netlify
   - Firebase Hosting

### 3. Configure CORS (Important!)

Your server must allow cross-origin requests for font files. Add these headers:

**Apache (.htaccess)**:
```apache
<IfModule mod_headers.c>
  <FilesMatch "\.(ttf|otf|eot|woff|woff2)$">
    Header set Access-Control-Allow-Origin "*"
  </FilesMatch>
</IfModule>
```

**Nginx**:
```nginx
location /fonts/ {
    add_header Access-Control-Allow-Origin *;
}
```

**Node.js/Express**:
```javascript
app.use('/fonts', express.static('fonts', {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));
```

### 4. Update App Configuration

Open `/app/quran/mushaf.tsx` and update the `QURAN_FONTS_API` constant:

```typescript
// Replace this with your actual server URL
const QURAN_FONTS_API = 'https://your-domain.com/fonts/';
//                                                       ↑
//                                        Note: Must end with /
```

### 5. Test the Setup

1. Run your app: `npm start`
2. Navigate to the Quran section
3. Select any surah to open the mushaf view
4. Verify that:
   - Pages load properly
   - Arabic text displays correctly
   - You can scroll between pages
   - Verses can be selected (highlighted on tap)

### 6. Troubleshooting

#### Fonts Not Loading

1. **Check URL**: Ensure `QURAN_FONTS_API` ends with `/`
2. **Verify HTTPS**: Use `https://` not `http://` in production
3. **Test Directly**: Open `https://your-domain.com/fonts/QCF_P001.ttf` in a browser
4. **Check Console**: Look for CORS or network errors in React Native logs

#### Incorrect Display

1. **Font Extension**: Must be `.ttf` (lowercase)
2. **Font Names**: Must follow the pattern `QCF_P001.ttf` to `QCF_P604.ttf`
3. **Complete Set**: Ensure all 604 font files are uploaded

#### Performance Issues

1. **Use CDN**: Host fonts on a CDN for faster loading
2. **Enable Caching**: Configure proper cache headers:
   ```
   Cache-Control: public, max-age=31536000
   ```
3. **Compress**: Enable gzip compression for font files

## Package Information

- **Package**: `react-native-quran-hafs`
- **GitHub**: https://github.com/mohamedshawky982/react-native-quran-hafs
- **Features**:
  - Display Quran in traditional mushaf format
  - Page-by-page navigation (604 pages)
  - Verse selection and bookmarking
  - Support for both surah and juz views
  - Copy verse text
  - RTL support

## Additional Dependencies

The following packages are automatically installed:

```json
{
  "react-native-quran-hafs": "latest",
  "@react-native-clipboard/clipboard": "^1.x",
  "@react-native-community/slider": "^4.x",
  "react-native-dynamic-fonts": "latest",
  "react-native-fs": "^2.x",
  "react-native-responsive-fontsize": "^0.5.x",
  "react-native-track-player": "^3.x"
}
```

## Support

For issues related to:
- **Font setup**: Check this guide
- **Package bugs**: https://github.com/mohamedshawky982/react-native-quran-hafs/issues
- **App-specific issues**: Contact your development team

## Security Notes

1. **HTTPS Only**: Always use HTTPS in production
2. **CORS**: Configure CORS properly to prevent unauthorized access
3. **Authentication**: Consider adding authentication if hosting privately
4. **Rate Limiting**: Implement rate limiting to prevent abuse

## License

The Quran text and fonts are freely available for Islamic applications. Ensure compliance with the license terms of the specific fonts you use.
