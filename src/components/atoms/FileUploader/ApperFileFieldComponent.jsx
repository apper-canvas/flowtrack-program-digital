import { useState, useEffect, useRef, useMemo } from 'react';

const ApperFileFieldComponent = ({ config, elementId }) => {
  // State management for UI-driven values
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for tracking lifecycle and preventing memory leaks
  const mountedRef = useRef(false);
  const elementIdRef = useRef(elementId);
  const existingFilesRef = useRef([]);

  // Update elementIdRef when elementId changes
  useEffect(() => {
    elementIdRef.current = elementId;
  }, [elementId]);

  // Memoized existing files to prevent unnecessary re-renders
  const memoizedExistingFiles = useMemo(() => {
    if (!config?.existingFiles || !Array.isArray(config.existingFiles)) {
      return [];
    }
    
    // Detect actual changes by comparing length and first file's ID/id
    const currentFiles = config.existingFiles;
    const previousFiles = existingFilesRef.current;
    
    if (currentFiles.length !== previousFiles.length) {
      return currentFiles;
    }
    
    if (currentFiles.length > 0 && previousFiles.length > 0) {
      const currentFirstId = currentFiles[0]?.Id || currentFiles[0]?.id;
      const previousFirstId = previousFiles[0]?.Id || previousFiles[0]?.id;
      
      if (currentFirstId !== previousFirstId) {
        return currentFiles;
      }
    }
    
    return previousFiles;
  }, [config?.existingFiles]);

  // Initial Mount Effect
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Wait for ApperSDK to load (max 50 attempts × 100ms = 5 seconds)
        let attempts = 0;
        const maxAttempts = 50;
        
        while (!window.ApperSDK && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.ApperSDK) {
          throw new Error('ApperSDK not loaded. Please ensure the SDK script is included before this component.');
        }
        
        const { ApperFileUploader } = window.ApperSDK;
        if (!ApperFileUploader?.FileField?.mount) {
          throw new Error('ApperFileUploader.FileField.mount not available');
        }
        
        // Set element ID for mounting
        elementIdRef.current = `file-uploader-${elementId}`;
        
        // Mount the file field with full config
        await ApperFileUploader.FileField.mount(elementIdRef.current, {
          ...config,
          existingFiles: memoizedExistingFiles
        });
        
        mountedRef.current = true;
        existingFilesRef.current = memoizedExistingFiles;
        setIsReady(true);
        setError(null);
        
      } catch (err) {
        console.error('Error mounting ApperFileFieldComponent:', err);
        setError(err.message);
        setIsReady(false);
      }
    };
    
    initializeSDK();
    
    // Cleanup on component destruction
    return () => {
      try {
        if (window.ApperSDK?.ApperFileUploader?.FileField?.unmount && elementIdRef.current) {
          window.ApperSDK.ApperFileUploader.FileField.unmount(elementIdRef.current);
        }
        mountedRef.current = false;
        existingFilesRef.current = [];
        setIsReady(false);
      } catch (err) {
        console.error('Error unmounting ApperFileFieldComponent:', err);
      }
    };
  }, [elementId, config?.fieldKey, config?.tableName, config?.apperProjectId, config?.apperPublicKey]);

  // File Update Effect
  useEffect(() => {
    const updateFiles = async () => {
      try {
        // Early returns for safety checks
        if (!isReady || !window.ApperSDK?.ApperFileUploader?.FileField || !config?.fieldKey) {
          return;
        }
        
        // Deep equality check with JSON.stringify
        const currentFilesStr = JSON.stringify(memoizedExistingFiles);
        const previousFilesStr = JSON.stringify(existingFilesRef.current);
        
        if (currentFilesStr === previousFilesStr) {
          return;
        }
        
        const { ApperFileUploader } = window.ApperSDK;
        
        // Format detection: check for .Id vs .id property
        let filesToUpdate = memoizedExistingFiles;
        
        if (filesToUpdate.length > 0) {
          // Check if format conversion is needed (API format has .Id, UI format has .id)
          const hasApiFormat = filesToUpdate.some(file => file.hasOwnProperty('Id'));
          const hasUIFormat = filesToUpdate.some(file => file.hasOwnProperty('id'));
          
          if (hasApiFormat && !hasUIFormat) {
            // Convert from API to UI format
            filesToUpdate = ApperFileUploader.toUIFormat(filesToUpdate);
          }
        }
        
        // Update files or clear field based on content
        if (filesToUpdate.length > 0) {
          await ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate);
        } else {
          await ApperFileUploader.FileField.clearField(config.fieldKey);
        }
        
        existingFilesRef.current = memoizedExistingFiles;
        
      } catch (err) {
        console.error('Error updating files in ApperFileFieldComponent:', err);
        setError(err.message);
      }
    };
    
    updateFiles();
  }, [memoizedExistingFiles, isReady, config?.fieldKey]);

  // Error UI
  if (error) {
    return (
      <div className="border border-red-300 rounded-lg p-4 bg-red-50">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 text-red-500">⚠</div>
          <div className="text-sm text-red-700">
            File uploader error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main container with unique ID for SDK mounting */}
      <div 
        id={`file-uploader-${elementId}`}
        className="min-h-[120px] border border-slate-300 rounded-lg p-4 bg-white"
      >
        {/* Loading UI */}
        {!isReady && (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            <span className="ml-2 text-sm text-slate-600">Loading file uploader...</span>
          </div>
        )}
        {/* SDK takes over this container when mounted */}
      </div>
    </div>
  );
};

export default ApperFileFieldComponent;