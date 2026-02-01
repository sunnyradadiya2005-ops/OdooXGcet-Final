// Currency formatter for Indian Rupees
export const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
};

// Date formatter
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Date and time formatter
export const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Calculate rental days
export const calculateRentalDays = (startDate, endDate) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1; // Minimum 1 day
};

// Format order status for display
export const formatOrderStatus = (status) => {
    const statusMap = {
        QUOTATION: 'Quotation',
        RENTAL_ORDER: 'Pending Payment',
        CONFIRMED: 'Confirmed',
        PICKED_UP: 'Picked Up',
        RETURNED: 'Returned',
        CANCELLED: 'Cancelled',
    };
    return statusMap[status] || status;
};
