export const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

export const isOverdue = (dateString) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
};

export const isValidYear = (dateString) => {
  if (!dateString) return true;
  const yearStr = dateString.split('-')[0];
  return yearStr.length === 4 && /^\d{4}$/.test(yearStr);
};