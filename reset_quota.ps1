# Reset Gemini API Quota for Testing
Write-Host "🔄 Resetting Gemini API Quota for testing..." -ForegroundColor Green

# Clear localStorage quota data
Write-Host "📝 Clearing localStorage quota data..." -ForegroundColor Yellow

# Create a simple HTML file to clear localStorage
$htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Reset Quota</title>
</head>
<body>
    <h2>Resetting API Quota...</h2>
    <script>
        // Clear quota data
        localStorage.removeItem('gemini_daily_stats');
        console.log('✅ Quota data cleared from localStorage');
        
        // Show reset confirmation
        document.body.innerHTML = '<h2 style="color: green;">✅ Quota Reset Complete!</h2><p>You can now close this tab and return to your app.</p>';
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            window.close();
        }, 3000);
    </script>
</body>
</html>
"@

$htmlContent | Out-File -FilePath "reset_quota.html" -Encoding UTF8

Write-Host "🌐 Opening quota reset page..." -ForegroundColor Cyan
Start-Process "reset_quota.html"

Write-Host "✅ Quota reset page opened!" -ForegroundColor Green
Write-Host "📝 Instructions:" -ForegroundColor Yellow
Write-Host "   1. The reset page will automatically clear your quota data" -ForegroundColor White
Write-Host "   2. Close the reset page after it shows 'Quota Reset Complete!'" -ForegroundColor White
Write-Host "   3. Return to your app - the quota should now be reset" -ForegroundColor White
Write-Host "   4. You can delete the 'reset_quota.html' file after use" -ForegroundColor White

# Clean up the HTML file after a delay
Start-Sleep -Seconds 10
if (Test-Path "reset_quota.html") {
    Remove-Item "reset_quota.html"
    Write-Host "🧹 Cleaned up temporary files" -ForegroundColor Green
} 