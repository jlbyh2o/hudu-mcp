/**
 * Copyright (c) 2025 HUDU MCP Server Contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * Maximum response size in characters (approximately 1MB in tokens)
 * Using conservative estimate: 1 token ≈ 4 characters
 * 1MB = 1,048,576 tokens ≈ 4,194,304 characters
 * Using 3MB as safety margin
 */
const MAX_RESPONSE_SIZE = 3_000_000;

/**
 * Truncate response data if it exceeds the maximum size
 */
export function truncateResponse(data: any): { data: any; truncated: boolean; originalSize: number } {
  const jsonString = JSON.stringify(data, null, 2);
  const originalSize = jsonString.length;
  
  if (originalSize <= MAX_RESPONSE_SIZE) {
    return {
      data,
      truncated: false,
      originalSize
    };
  }

  // If response is too large, truncate arrays and objects
  const truncatedData = truncateDataRecursively(data, MAX_RESPONSE_SIZE * 0.8); // Use 80% of limit for safety
  
  return {
    data: {
      ...truncatedData,
      _truncation_info: {
        truncated: true,
        original_size_chars: originalSize,
        truncated_size_chars: JSON.stringify(truncatedData, null, 2).length,
        message: 'Response was truncated due to size limits. Use pagination parameters to get smaller chunks of data.'
      }
    },
    truncated: true,
    originalSize
  };
}

/**
 * Recursively truncate data structures
 */
function truncateDataRecursively(data: any, maxSize: number): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    const truncatedArray = [];
    let currentSize = 0;
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const itemString = JSON.stringify(item, null, 2);
      
      if (currentSize + itemString.length > maxSize) {
        // Add truncation info
        truncatedArray.push({
          _truncated: true,
          _message: `Array truncated at index ${i}. Original length: ${data.length}, showing first ${i} items.`,
          _remaining_items: data.length - i
        });
        break;
      }
      
      truncatedArray.push(truncateDataRecursively(item, maxSize / 10)); // Limit individual items
      currentSize += itemString.length;
    }
    
    return truncatedArray;
  }

  // Handle objects
  const truncatedObject: any = {};
  let currentSize = 0;
  const entries = Object.entries(data);
  
  for (const [key, value] of entries) {
    const valueString = JSON.stringify(value, null, 2);
    
    if (currentSize + valueString.length > maxSize) {
      truncatedObject._truncated = true;
      truncatedObject._message = `Object truncated. Some properties were omitted due to size limits.`;
      break;
    }
    
    // Special handling for large text fields
    if (typeof value === 'string' && value.length > 10000) {
      truncatedObject[key] = value.substring(0, 10000) + '... [truncated]';
    } else {
      truncatedObject[key] = truncateDataRecursively(value, maxSize / 10);
    }
    
    currentSize += valueString.length;
  }
  
  return truncatedObject;
}

/**
 * Create a standardized MCP response with truncation support
 */
export function createMcpResponse(data: any, summary?: string): any {
  const { data: responseData, truncated, originalSize } = truncateResponse(data);
  
  const response = {
    content: [
      {
        type: 'text',
        text: JSON.stringify(responseData, null, 2)
      }
    ]
  };
  
  // Add truncation warning to summary if needed
  if (truncated && summary) {
    const truncationWarning = ` [Response truncated from ${Math.round(originalSize / 1000)}KB due to size limits]`;
    responseData.summary = summary + truncationWarning;
  }
  
  return response;
}