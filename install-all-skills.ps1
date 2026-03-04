# Script para instalar todas las skills recomendadas para Violet ERP
Write-Host "Instalando skills para Violet ERP..." -ForegroundColor Green

$skills = @(
    # TypeScript & JavaScript
    "wshobson/agents@typescript-advanced-types",
    "github/awesome-copilot@javascript-typescript-jest",
    
    # Architecture & Patterns
    "wshobson/agents@architecture-patterns",
    "wshobson/agents@api-design-principles",
    "wshobson/agents@nodejs-backend-patterns",
    "wshobson/agents@nextjs-app-router-patterns",
    
    # Testing & Quality
    "obra/superpowers@verification-before-completion",
    "obra/superpowers@code-review-excellence",
    "anthropics/skills@webapp-testing",
    
    # UI/UX & Design
    "wshobson/agents@tailwind-design-system",
    "anthropics/skills@frontend-design",
    
    # Documentation
    "obra/superpowers@writing-skills",
    
    # Performance
    "wshobson/agents@python-performance-optimization",
    "vercel-labs/next-skills@next-cache-components",
    
    # Database
    # Ya instalado: supabase-postgres-best-practices
    
    # Development Workflow
    "obra/superpowers@subagent-driven-development",
    "obra/superpowers@using-git-worktrees",
    "obra/superpowers@finishing-a-development-branch",
    
    # Data & Visualization
    "inference-sh-9/skills@data-visualization",
    
    # Security
    "better-auth/skills@better-auth-best-practices",
    
    # MCP & Advanced
    "anthropics/skills@mcp-builder"
)

$installed = 0
$failed = 0

foreach ($skill in $skills) {
    Write-Host "`nInstalando: $skill" -ForegroundColor Cyan
    $result = npx skills add $skill --yes 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Instalado: $skill" -ForegroundColor Green
        $installed++
    } else {
        Write-Host "✗ Error: $skill" -ForegroundColor Red
        $failed++
    }
    Start-Sleep -Seconds 2
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Resumen de instalación:" -ForegroundColor Yellow
Write-Host "✓ Instaladas: $installed" -ForegroundColor Green
Write-Host "✗ Fallidas: $failed" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Yellow
