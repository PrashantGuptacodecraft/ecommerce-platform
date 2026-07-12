@echo off
echo Running DB Lint...
npx supabase db lint --linked --level error --fail-on error
if errorlevel 1 goto error

echo Running DB Types...
npm run db:types
if errorlevel 1 goto error

echo Running Type Check...
npm run type-check
if errorlevel 1 goto error

echo Running Tests...
npm run test
if errorlevel 1 goto error

echo Running Build...
npm run build
if errorlevel 1 goto error

echo Running Format Check...
npm run format:check
if errorlevel 1 goto error

echo Running Audit...
npm audit
if errorlevel 1 goto error

echo ALL GATES PASSED!
exit /b 0

:error
echo A GATE FAILED!
exit /b 1
