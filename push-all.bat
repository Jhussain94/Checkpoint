@echo off
echo ========================================
echo  Pushing ALL project files to GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Staging all files...
git add -A

echo [2/4] Committing...
git commit -m "Add all assets: images, audio, fonts"

echo [3/4] Pushing to GitHub...
git push

echo.
echo ========================================
echo  Done! Check https://github.com to
echo  confirm all images appear in the repo.
echo ========================================
pause
