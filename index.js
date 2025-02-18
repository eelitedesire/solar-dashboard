const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8099;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.static('public'));

// Define the path to your dashboard JSON configuration file
const DASHBOARD_CONFIG_PATH = path.join(__dirname, 'dashboard-config.json');

// Route to serve the HTML dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get solar data from the JSON file
app.get('/api/solar-data', (req, res) => {
    try {
        const dashboardData = JSON.parse(fs.readFileSync(DASHBOARD_CONFIG_PATH, 'utf8'));
        
        // Extract the necessary panel information from the dashboard config
        const solarData = {};
        
        // Parse through panels and extract configuration
        dashboardData.panels.forEach(panel => {
            const panelId = panel.id.toString();
            const title = panel.title;
            const fieldConfig = panel.fieldConfig?.defaults || {};
            
            solarData[panelId] = {
                title,
                unit: fieldConfig.unit || '',
                min: fieldConfig.min,
                max: fieldConfig.max,
                thresholds: fieldConfig.thresholds?.steps || [],
                customProperties: {
                    neutral: fieldConfig.custom?.neutral,
                    orientation: panel.options?.orientation || 'auto'
                }
            };
            
            // Add any special configurations based on panel type
            if (panel.type === 'gauge') {
                solarData[panelId].gaugeConfig = {
                    showThresholdLabels: panel.options?.showThresholdLabels || false,
                    showThresholdMarkers: panel.options?.showThresholdMarkers || true
                };
            }
        });
        
        res.json(solarData);
    } catch (error) {
        console.error('Error reading dashboard config:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve solar data',
            error: error.message 
        });
    }
});

// API endpoint to update panel range settings in the JSON file
app.post('/api/update-panel-range', (req, res) => {
    try {
        const { panelId, min, max } = req.body;
        
        if (typeof min !== 'number' || typeof max !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Min and max values must be numbers'
            });
        }
        
        // Read the current dashboard config
        const dashboardData = JSON.parse(fs.readFileSync(DASHBOARD_CONFIG_PATH, 'utf8'));
        
        // Find the specific panel by ID and update min/max values
        const panel = dashboardData.panels.find(p => p.id.toString() === panelId);
        
        if (!panel) {
            return res.status(404).json({ 
                success: false, 
                message: `Panel with ID ${panelId} not found` 
            });
        }
        
        // Ensure the fieldConfig structure exists
        if (!panel.fieldConfig) panel.fieldConfig = {};
        if (!panel.fieldConfig.defaults) panel.fieldConfig.defaults = {};
        
        // Update the min and max values
        panel.fieldConfig.defaults.min = min;
        panel.fieldConfig.defaults.max = max;
        
        // Write the updated config back to the file
        fs.writeFileSync(DASHBOARD_CONFIG_PATH, JSON.stringify(dashboardData, null, 2), 'utf8');
        
        res.json({ 
            success: true, 
            message: 'Panel range updated successfully',
            updatedConfig: {
                min,
                max,
                panelId
            }
        });
    } catch (error) {
        console.error('Error updating panel range:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update panel range',
            error: error.message 
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});