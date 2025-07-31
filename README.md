# Madagascar License Scanner 🇲🇬

A React-based web application for scanning and decoding Madagascar driver's license PDF417 barcodes offline.

## Features

- 📱 **Camera-based PDF417 scanning** - Use your phone camera to scan barcodes
- 🔓 **Offline decoding** - All processing happens in your browser
- 🖼️ **Image extraction** - View embedded license photos
- 📋 **Complete license information** - Name, ID, dates, restrictions, etc.
- 🔐 **Secure** - No data sent to servers, client-side only
- 📱 **Mobile-optimized** - Works great on smartphones

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **@zxing/library** for PDF417 barcode scanning
- **pako** for zlib decompression
- **Vercel** for deployment

## Security Features

- Static key XOR encryption (length-preserving)
- zlib compression for size optimization
- Standardized 9-field pipe-delimited format
- Embedded photo support (60x90 pixels, grayscale JPEG)

## Decoded Information

1. Person Name (Initials and Surname)
2. National ID Number (12 digits)
3. Date of Birth (YYYY-MM-DD)
4. License Number (13 digits)
5. Valid Date Range (From - To)
6. License Category Codes
7. Vehicle Restrictions
8. Driver Restrictions
9. Gender (M/F)

## Usage

### Camera Scanning
1. Open the app on your mobile device
2. Click "Start Camera"
3. Position the PDF417 barcode within the green viewfinder
4. The app will automatically detect and decode the barcode
5. View the decoded license information and photo

### Manual Input
1. Click "Enter Hex Data Manually"
2. Paste the hex-encoded barcode data
3. Click "Decode Data"
4. View the results

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/schuttebj/linc-scan.git
cd linc-scan

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This app is configured for easy deployment to Vercel:

1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

The app includes:
- Vercel configuration (`vercel.json`)
- Security headers
- SPA routing support
- Optimized build settings

## Browser Requirements

- Modern browser with camera access
- HTTPS required for camera permissions
- WebRTC support for video streaming

## Security Notes

⚠️ **Development Version**: The encryption key is exposed in the client-side code. This is acceptable for development and third-party integration scenarios where the key is meant to be shared.

For production use with sensitive data, consider:
- Server-side decoding
- Dynamic key exchange
- Additional authentication layers

## License

This is a development tool for Madagascar driver's license barcode integration. Use in accordance with local regulations and data protection laws.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues or questions:
- Check the browser console for error messages
- Ensure good lighting when scanning
- Verify barcode format compatibility
- Test camera permissions in HTTPS environment