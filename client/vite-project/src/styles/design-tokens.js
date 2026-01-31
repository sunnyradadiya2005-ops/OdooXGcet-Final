// Design System Tokens for KirayaKart
// Odoo-style professional ERP aesthetics

export const typography = {
    pageTitle: 'text-3xl font-bold text-slate-900',
    sectionTitle: 'text-xl font-semibold text-slate-800',
    subsectionTitle: 'text-lg font-medium text-slate-800',
    body: 'text-base text-slate-700',
    label: 'text-sm font-medium text-slate-700',
    helper: 'text-sm text-slate-600',
    tiny: 'text-xs text-slate-500',
};

export const spacing = {
    containerPadding: 'px-6 py-8',
    containerPaddingMobile: 'px-4 py-6',
    cardPadding: 'p-6',
    cardPaddingCompact: 'p-4',
    sectionGap: 'space-y-8',
    subsectionGap: 'space-y-6',
    fieldGap: 'space-y-4',
    gridGap: 'gap-6',
    gridGapCompact: 'gap-4',
    buttonGap: 'gap-2',
};

export const colors = {
    primary: 'teal-600',
    primaryHover: 'teal-700',
    primaryLight: 'teal-50',

    neutral: {
        bg: 'white',
        bgSubtle: 'slate-50',
        bgDisabled: 'slate-100',
        text: 'slate-900',
        textBody: 'slate-700',
        textLabel: 'slate-600',
        textMuted: 'slate-500',
        border: 'slate-200',
        borderDark: 'slate-300',
    },

    status: {
        quotation: { bg: 'slate-100', text: 'slate-700' },
        rentalOrder: { bg: 'blue-100', text: 'blue-700' },
        confirmed: { bg: 'green-100', text: 'green-700' },
        pickedUp: { bg: 'amber-100', text: 'amber-700' },
        returned: { bg: 'slate-100', text: 'slate-700' },
        cancelled: { bg: 'red-100', text: 'red-700' },
        pending: { bg: 'amber-100', text: 'amber-700' },
        completed: { bg: 'green-100', text: 'green-700' },
    },

    semantic: {
        success: 'green-600',
        warning: 'amber-600',
        error: 'red-600',
        info: 'blue-600',
    },
};

export const buttons = {
    primary: 'px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'px-6 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    destructive: 'px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    small: 'px-4 py-2 text-sm',
    icon: 'p-2 rounded-lg hover:bg-slate-100 transition-colors',
};

export const inputs = {
    base: 'w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors',
    label: 'block text-sm font-medium text-slate-700 mb-2',
    helper: 'text-xs text-slate-500 mt-1',
    error: 'text-xs text-red-600 mt-1',
};

export const cards = {
    standard: 'bg-white rounded-xl border border-slate-200 p-6 shadow-sm',
    hover: 'bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow',
    metric: 'bg-white rounded-xl border border-slate-200 p-6',
};

export const tables = {
    container: 'overflow-x-auto',
    table: 'w-full',
    thead: 'bg-slate-50 border-b border-slate-200',
    th: 'px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider',
    tbody: 'bg-white divide-y divide-slate-200',
    tr: 'hover:bg-slate-50 transition-colors',
    td: 'px-6 py-4 text-sm text-slate-700',
};

export const statusBadge = (status) => {
    const statusKey = status?.toLowerCase().replace('_', '');
    const statusColors = colors.status[statusKey] || colors.status.quotation;
    return `px-3 py-1 rounded-full text-xs font-medium bg-${statusColors.bg} text-${statusColors.text}`;
};

// Helper function to get status colors
export const getStatusColors = (status) => {
    const statusMap = {
        'QUOTATION': colors.status.quotation,
        'RENTAL_ORDER': colors.status.rentalOrder,
        'CONFIRMED': colors.status.confirmed,
        'PICKED_UP': colors.status.pickedUp,
        'RETURNED': colors.status.returned,
        'CANCELLED': colors.status.cancelled,
        'PENDING': colors.status.pending,
        'COMPLETED': colors.status.completed,
    };
    return statusMap[status] || colors.status.quotation;
};
