export const formatSuccess = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

export const formatError = (message = 'An error occurred', errorCode = 'SERVER_ERROR', details = []) => {
  return {
    success: false,
    message,
    error: {
      code: errorCode,
      details,
    },
  };
};

