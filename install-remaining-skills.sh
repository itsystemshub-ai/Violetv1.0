#!/bin/bash
# Script para instalar skills restantes para Violet ERP

echo "🚀 Instalando skills masivamente para Violet ERP..."
echo ""

# Array de skills a instalar
skills=(
    # Architecture & Patterns
    "wshobson/agents@architecture-patterns"
    "wshobson/agents@api-design-principles"
    "wshobson/agents@nodejs-backend-patterns"
    "wshobson/agents@nextjs-app-router-patterns"
    
    # Code Quality
    "wshobson/agents@code-review-excellence"
    "obra/superpowers@verification-before-completion"
    "obra/superpowers@requesting-code-review"
    "obra/superpowers@receiving-code-review"
    
    # UI/UX & Design
    "wshobson/agents@tailwind-design-system"
    "anthropics/skills@frontend-design"
    "anthropics/skills@canvas-design"
    
    # Testing
    "anthropics/skills@webapp-testing"
    
    # Documentation
    "obra/superpowers@writing-skills"
    "anthropics/skills@doc-coauthoring"
    
    # Development Workflow
    "obra/superpowers@subagent-driven-development"
    "obra/superpowers@using-git-worktrees"
    "obra/superpowers@finishing-a-development-branch"
    "obra/superpowers@dispatching-parallel-agents"
    
    # Performance
    "vercel-labs/next-skills@next-cache-components"
    "wshobson/agents@python-performance-optimization"
    
    # Data & Visualization
    "inference-sh-9/skills@data-visualization"
    
    # Security & Auth
    "better-auth/skills@better-auth-best-practices"
    "better-auth/skills@create-auth-skill"
    
    # Advanced
    "anthropics/skills@mcp-builder"
    "anthropics/skills@skill-creator"
    
    # Additional Vercel
    "vercel-labs/agent-skills@vercel-composition-patterns"
    
    # Expo/React Native (si necesitas mobile)
    "expo/skills@building-native-ui"
    "expo/skills@native-data-fetching"
)

installed=0
failed=0
total=${#skills[@]}

echo "📦 Total de skills a instalar: $total"
echo ""

for skill in "${skills[@]}"; do
    echo "⏳ Instalando: $skill"
    
    # Instalar con --yes para auto-confirmar
    if echo "" | npx skills add "$skill" --yes > /dev/null 2>&1; then
        echo "✅ Instalado: $skill"
        ((installed++))
    else
        echo "❌ Error: $skill"
        ((failed++))
    fi
    
    # Pequeña pausa para no saturar
    sleep 1
    echo ""
done

echo "========================================"
echo "📊 Resumen de instalación:"
echo "✅ Instaladas: $installed/$total"
echo "❌ Fallidas: $failed/$total"
echo "========================================"
