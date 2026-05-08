# Royal Rangers Nigeria Southwest Zone 2 - Official Website

A full static and backend-enabled website with a membership database portal for Royal Rangers Nigeria Southwest Zone 2.

## Features
- Public-facing organizational content and program pages
- Membership registration system with passport photograph upload
- Centralized member database with unique ID generation
- Secure admin portal with login, approval workflow, and member management
- Separate public site and administrative access
- Scalable structure for future attendance, promotion, and reporting features

## Files
- `index.html` - Homepage
- `about.html` - Organizational profile
- `leadership.html` - Leadership and officer profiles
- `units.html` - Department and unit structure
- `programs.html` - Activities and programs
- `media.html` - Photo gallery
- `announcements.html` - News and circulars
- `contact.html` - Contact information and enquiry form
- `register.html` - Member registration form
- `css/style.css` - Site styles
- `js/main.js` - Navigation behavior
- `js/register.js` - Membership registration client behavior
- `js/admin.js` - Admin dashboard client behavior
- `server.js` - Backend Express server and API routes
- `db.js` - SQLite database initialization and helper functions
- `views/login.ejs` - Admin login view
- `views/dashboard.ejs` - Admin dashboard view
- `database.sqlite` - Generated member database file (created at runtime)
- `uploads/` - Uploaded passport photographs (created at runtime)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Visit the public site:
   ```
   http://localhost:3000/
   ```
4. Visit the admin portal:
   ```
   http://localhost:3000/admin/login
   ```

## Default Admin Login
- Email: `admin@royalrangerssw2.ng`
- Password: `Admin123!`

> Use environment variables `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` to override defaults if needed.

## Notes
- Uploaded images are stored in `uploads/`.
- The portal is protected with session-based authentication.
- The application uses MongoDB for database storage.
