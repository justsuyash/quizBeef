#!/bin/bash

echo "🧹 Killing all development processes and freeing ports..."

# Kill all Wasp processes
echo "🔥 Killing Wasp processes..."
pkill -f wasp 2>/dev/null || true
pkill -f "wasp-bin" 2>/dev/null || true

# Kill processes on common development ports
echo "🔥 Killing processes on development ports..."
ports=(3000 3001 3002 3003 5432 8000 8080 4000 4001 5000 5001 6000)

for port in "${ports[@]}"; do
    pid=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "   Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
done

# Kill Node.js processes that might be hanging
echo "🔥 Killing Node.js development processes..."
pkill -f "node.*vite" 2>/dev/null || true
pkill -f "node.*nodemon" 2>/dev/null || true
pkill -f "node.*webpack" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true

# Kill Docker containers (if any Wasp-related)
echo "🔥 Stopping Docker containers..."
docker ps --filter "name=wasp" --format "{{.ID}}" | xargs -r docker stop 2>/dev/null || true
docker ps --filter "name=postgres" --format "{{.ID}}" | xargs -r docker stop 2>/dev/null || true

# Kill any remaining esbuild processes
echo "🔥 Killing build tool processes..."
pkill -f esbuild 2>/dev/null || true
pkill -f rollup 2>/dev/null || true

# Force kill any processes using common development directories
echo "🔥 Killing processes in development directories..."
pkill -f ".wasp/out" 2>/dev/null || true
pkill -f "node_modules" 2>/dev/null || true

echo ""
echo "✅ Process cleanup complete!"
echo ""
echo "📊 Current port usage:"
lsof -i :3000,3001,3002,5432 2>/dev/null || echo "   No processes found on common ports"

echo ""
echo "🚀 All development processes killed and ports freed!"
echo "   You can now run 'wasp start' cleanly."