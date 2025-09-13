# Photo Manager - Photography Portfolio Platform

A professional photography portfolio and client gallery management system built with Next.js, designed to help photographers upload, organize, and share their work with clients through secure, watermarked previews.

## 🚀 Features

- **Photo Upload & Management**: Drag & drop photo uploads with automatic organization
- **Watermark Protection**: Automatic watermark generation for client previews
- **Secure Client Galleries**: Share preview links without giving access to originals
- **Download Restrictions**: Protect your original work from unauthorized downloads
- **Client Management**: Organize clients and photo sessions
- **Responsive Design**: Works perfectly on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Next.js API Routes (BFF pattern)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Image Processing**: Sharp for resizing and watermarking
- **Styling**: Tailwind CSS

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd photo_manager
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.local` and update with your settings:

   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/photo_manager?schema=public"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # File Upload
   UPLOAD_DIR="./uploads"
   MAX_FILE_SIZE="10485760" # 10MB

   # Watermark Settings
   WATERMARK_TEXT="Preview Only"
   WATERMARK_OPACITY="0.5"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma database GUI

### Database Management

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma studio` - Open database GUI

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── gallery/           # Client gallery pages
├── components/            # Reusable UI components
├── lib/                   # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── image-utils.ts    # Image processing utilities
└── types/                 # TypeScript type definitions
```

## 🔐 Authentication

The system uses NextAuth.js with credentials provider. To create the first user, you'll need to:

1. Hash a password using bcrypt
2. Insert a user record directly into the database
3. Use the sign-in page to authenticate

## 🎨 Customization

### Watermark Settings

Customize watermarks in `src/lib/image-utils.ts`:

- Text content
- Opacity
- Font size
- Position

### Styling

This project uses Tailwind CSS. Customize the design by:

- Editing `tailwind.config.ts`
- Modifying component styles in the respective files
- Adding custom CSS in `src/app/globals.css`

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS/Google Cloud/Azure

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email [your-email] or create an issue in the GitHub repository.
