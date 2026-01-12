/**
 * ConfirmDialog - Reusable confirmation dialog
 */

import React from "react";
import {
  Box,
  Flex,
  Text,
  Button,
} from "@vibe/core";
import "./ConfirmDialog.css";

const ConfirmDialog = ({
  show,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "negative",
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <Box padding="large">
          <Flex direction="column" gap="large">
            <Flex direction="column" gap="small">
              <Text type="text1" weight="bold">{title}</Text>
              <Text type="text2" color="secondary">
                {message}
              </Text>
            </Flex>
            <Flex gap="small" justify="end">
              <Button
                size="medium"
                kind="tertiary"
                onClick={onCancel}
              >
                {cancelText}
              </Button>
              <Button
                size="medium"
                kind="primary"
                color={confirmColor}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </Flex>
          </Flex>
        </Box>
      </div>
    </div>
  );
};

export default ConfirmDialog;
