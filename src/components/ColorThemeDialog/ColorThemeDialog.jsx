import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalFooter, Button, Flex, Text, RadioButton, Box } from "@vibe/core";
import { COLOR_THEMES } from "../../constants/colorThemes";
import "./ColorThemeDialog.css";

const ColorThemeDialog = ({ 
  show, 
  onClose, 
  currentTheme = "monday",
  currentColorMode = "group", // "group" or "theme"
  onApply 
}) => {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [colorMode, setColorMode] = useState(currentColorMode);

  const handleApply = () => {
    onApply({ theme: selectedTheme, colorMode });
    onClose();
  };

  if (!show) return null;

  return (
    <Modal show={show} onClose={onClose} width="large">
      <ModalHeader title="Color Theme Settings" onClose={onClose} />
      
      <ModalContent>
        <Flex direction="column" gap="large">
          {/* Color Mode Selection */}
          <Box>
            <Text type="text1" weight="bold" className="section-title">
              Item Color Mode
            </Text>
            <Text type="text2" color="secondary" className="section-description">
              Choose how colors are applied to items on the wheel
            </Text>
            
            <Flex direction="column" gap="medium" style={{ marginTop: '16px' }}>
              <div 
                className={`color-mode-option ${colorMode === 'group' ? 'selected' : ''}`}
                onClick={() => setColorMode('group')}
              >
                <RadioButton 
                  name="colorMode"
                  checked={colorMode === 'group'}
                  onChange={() => setColorMode('group')}
                />
                <div className="color-mode-content">
                  <Text type="text2" weight="medium">Use Group Colors</Text>
                  <Text type="text3" color="secondary">
                    Items inherit colors from their Monday.com group
                  </Text>
                </div>
              </div>
              
              <div 
                className={`color-mode-option ${colorMode === 'theme' ? 'selected' : ''}`}
                onClick={() => setColorMode('theme')}
              >
                <RadioButton 
                  name="colorMode"
                  checked={colorMode === 'theme'}
                  onChange={() => setColorMode('theme')}
                />
                <div className="color-mode-content">
                  <Text type="text2" weight="medium">Use Theme Colors</Text>
                  <Text type="text3" color="secondary">
                    Items use colors from the selected theme palette
                  </Text>
                </div>
              </div>
            </Flex>
          </Box>

          {/* Theme Selection */}
          <Box>
            <Text type="text1" weight="bold" className="section-title">
              Color Theme
            </Text>
            <Text type="text2" color="secondary" className="section-description">
              Select a color palette for the wheel {colorMode === 'theme' ? 'and items' : '(month/week rings)'}
            </Text>
            
            <div className="theme-grid" style={{ marginTop: '16px' }}>
              {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                <div
                  key={key}
                  className={`theme-card ${selectedTheme === key ? 'selected' : ''}`}
                  onClick={() => setSelectedTheme(key)}
                >
                  <div className="theme-header">
                    <RadioButton 
                      name="theme"
                      checked={selectedTheme === key}
                      onChange={() => setSelectedTheme(key)}
                    />
                    <Text type="text2" weight="medium">{theme.name}</Text>
                  </div>
                  
                  <Text type="text3" color="secondary" className="theme-description">
                    {theme.description}
                  </Text>
                  
                  <div className="theme-preview">
                    {theme.colors.map((color, index) => (
                      <div 
                        key={index}
                        className="theme-color-swatch"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  
                  <div className="theme-rings">
                    <Text type="text3" color="secondary" style={{ fontSize: '10px' }}>
                      Rings:
                    </Text>
                    <div className="theme-ring-swatches">
                      {theme.monthRing.map((color, index) => (
                        <div 
                          key={`month-${index}`}
                          className="theme-ring-swatch"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <div 
                        className="theme-ring-swatch"
                        style={{ backgroundColor: theme.weekRing }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Box>
        </Flex>
      </ModalContent>
      
      <ModalFooter>
        <Button kind="tertiary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleApply}>
          Apply Theme
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ColorThemeDialog;
