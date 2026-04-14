# Gator Path
### William Jesser, Gabriel De Brito, Juan Carlos Plate, Hayden Russell, Samuel Garcia

Gator Path is a Next.js app for uploading a UF degree audit JSON, planning semesters, and generating schedule options from UF course data.

## Requirements

- Node.js 20+ (recommended)
- npm 10+

## Run Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open:
`http://localhost:3000`

4. Upload a degree audit JSON when prompted.
You can use a sample file in `profiles/` (for example `profiles/billy.json`).

## Scripts

- `npm run dev` starts the local development server.
- `npm run build` builds the production app.
- `npm run start` runs the built production app.
- `npm run lint` runs ESLint (if eslint is installed in your environment).

## Core Flow

1. Upload a ONE.UF degree audit JSON.
2. Use Coursework to add classes to semester plans.
3. Use Semester Planner to generate live options for the classes in that semester.
4. Apply an option and download the semester schedule as PDF.
