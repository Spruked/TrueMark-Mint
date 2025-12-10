#!/bin/bash

# TrueMark Mint - Caleon Bubble Host Plugin Deployment Script
# Deploys bubble host assistant plugins for Caleon Worker and UCM services

set -e

echo "🚀 Deploying TrueMark Mint Bubble Host Plugins..."

# Plugin directory
PLUGIN_DIR="/plugins"
SYSTEM_CONFIG="$PLUGIN_DIR/bubble-host-system-config.json"

# Create plugin directory if it doesn't exist
mkdir -p $PLUGIN_DIR

# Copy plugins
cp caleon-worker-plugin.json $PLUGIN_DIR/
cp caleon-ucm-plugin.json $PLUGIN_DIR/
cp bubble-host-system-config.json $PLUGIN_DIR/

# Set permissions
chmod 644 $PLUGIN_DIR/*.json

# Validate plugin configurations
echo "🔍 Validating plugin configurations..."
for plugin in $PLUGIN_DIR/caleon-*.json; do
    if [ -f "$plugin" ]; then
        echo "✅ Validating $plugin"
        # Basic JSON validation
        python3 -m json.tool $plugin > /dev/null
        echo "✅ $plugin is valid JSON"
    fi
done

# Register plugins with bubble host system
echo "📝 Registering plugins with bubble host system..."
if [ -f "$SYSTEM_CONFIG" ]; then
    echo "✅ System configuration found at $SYSTEM_CONFIG"

    # Here you would typically call the bubble host API to register plugins
    # For now, we'll just log the registration
    echo "🔗 Plugin registration commands:"
    echo "  - Register Caleon Worker Plugin: curl -X POST http://bubble-host:8080/api/plugins/register -d @$PLUGIN_DIR/caleon-worker-plugin.json"
    echo "  - Register Caleon UCM Plugin: curl -X POST http://bubble-host:8080/api/plugins/register -d @$PLUGIN_DIR/caleon-ucm-plugin.json"
fi

# Restart services to pick up new plugins
echo "🔄 Restarting Caleon services..."
docker restart caleon-worker 2>/dev/null || echo "⚠️  Caleon Worker not running in Docker"
docker restart caleon-ucm 2>/dev/null || echo "⚠️  Caleon UCM not running in Docker"

echo "✅ Plugin deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Verify plugin registration in bubble host dashboard"
echo "2. Test plugin functionality with TrueMark Mint operations"
echo "3. Monitor plugin performance and logs"
echo ""
echo "🔗 Useful commands:"
echo "  - Check plugin status: curl http://bubble-host:8080/api/plugins/status"
echo "  - View plugin logs: docker logs caleon-worker"
echo "  - View system logs: docker logs goat-system"