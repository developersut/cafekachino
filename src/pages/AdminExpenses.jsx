import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar,
  CreditCard,
  Tag,
  ShoppingBag,
  Zap,
  Users,
  Search,
  TrendingUp,
  BarChart as BarChartIcon,
  Edit2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { useKachinoStore } from '../store/useKachinoStore';
import { exportToCSV } from '../utils/exportUtils';

const AdminExpenses = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, settings, expenseCategories, fetchExpenses } = useKachinoStore();
  
  React.useEffect(() => {
    fetchExpenses();
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState('daily');
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setValue('description', expense.description);
      setValue('category', expense.category);
      setValue('amount', expense.amount);
      setValue('date', format(parseISO(expense.timestamp), 'yyyy-MM-dd'));
    } else {
      setEditingExpense(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    const expenseData = {
      description: data.description,
      category: data.category,
      amount: parseFloat(data.amount),
      timestamp: data.date ? new Date(data.date).toISOString() : new Date().toISOString()
    };
    
    if (editingExpense) {
      await updateExpense(editingExpense.id, expenseData);
      toast.success('Expense updated');
    } else {
      const result = await addExpense(expenseData);
      if (result?.success) {
        toast.success('Expense logged');
      } else {
        toast.error('Failed to log expense');
      }
    }
    setIsModalOpen(false);
    reset();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense permanently?')) {
      await deleteExpense(id);
      toast.success('Expense deleted');
    }
  };

  const categories = (expenseCategories || []).map(name => ({
    name,
    icon: name === 'Labor' ? Users : (name === 'Utilities' ? Zap : (name === 'Ingredients' ? ShoppingBag : Tag)),
    color: name === 'Labor' ? '#60a5fa' : (name === 'Utilities' ? '#fbbf24' : (name === 'Ingredients' ? '#4ade80' : '#a78bfa'))
  }));

  const filteredExpenses = expenses.filter(e => {
    const matchesCategory = filterCategory === "All" || e.category === filterCategory;
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory]);

  const sortedExpenses = React.useMemo(() => {
    return [...filteredExpenses].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [filteredExpenses]);

  const paginatedExpenses = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedExpenses.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedExpenses, currentPage]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const chartData = React.useMemo(() => {
    const periods = timeframe === 'daily' ? 7 : (timeframe === 'weekly' ? 4 : 6);
    const now = new Date();
    
    const data = [...Array(periods)].map((_, i) => {
      let d, dayStr, start, end;
      if (timeframe === 'daily') {
        d = subDays(now, i);
        dayStr = format(d, 'MMM dd');
        start = startOfDay(d);
        end = endOfDay(d);
      } else if (timeframe === 'weekly') {
        d = subWeeks(now, i);
        start = startOfWeek(d);
        end = endOfWeek(d);
        dayStr = `${format(start, 'MMM dd')} - ${format(end, 'dd')}`;
      } else {
        d = subMonths(now, i);
        start = startOfMonth(d);
        end = endOfMonth(d);
        dayStr = format(d, 'MMM yyyy');
      }

      const periodExpenses = expenses.filter(e => {
        const ed = parseISO(e.timestamp || e.date);
        return ed >= start && ed <= end;
      });

      return { name: dayStr, amount: periodExpenses.reduce((sum, e) => sum + e.amount, 0) };
    }).reverse();
    
    return data;
  }, [expenses, timeframe]);

  const handleExport = () => {
    exportToCSV(expenses, "Kachino_Expenses_Audit");
    toast.success("Expense report exported");
  };

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'fit-content' }}>
      <div className="header-row" style={{ marginBottom: '15px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', marginBottom: '4px' }}>Expenses</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Track business overheads</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="tab" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 18px', 
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--glass-border-gold)',
              color: 'var(--accent-gold)',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
            onClick={handleExport}
          >
            <CreditCard size={14} /> EXPORT CSV
          </button>
          <button 
            className="pay-button" 
            style={{ width: 'auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => handleOpenModal()}
          >
            <Plus size={20} />
            Log Expense
          </button>
        </div>
      </div>

      {/* Expense Trends Chart */}
      <div className="menu-card" style={{ padding: '20px', marginBottom: '20px', minHeight: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={18} color="#f87171" /> Expense Velocity
          </h3>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '10px' }}>
            {['daily', 'weekly', 'monthly'].map(t => (
              <button 
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  padding: '5px 15px',
                  fontSize: '11px',
                  borderRadius: '8px',
                  border: 'none',
                  background: timeframe === t ? '#f87171' : 'transparent',
                  color: timeframe === t ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: timeframe === t ? '700' : '400'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        {/* Absolute fallback and forced chart rendering */}
        <div style={{ width: '100%', height: '350px', background: 'rgba(255,255,255,0.01)', borderRadius: '15px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          {chartData && chartData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                 <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                 <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${settings?.currencySymbol || '$'}${v}`} />
                 <Tooltip 
                   cursor={{fill: 'rgba(255,255,255,0.03)'}}
                   contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '15px', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                 />
                 <Bar dataKey="amount" fill="var(--accent-gold)" radius={[8, 8, 0, 0]} barSize={45} animationDuration={1500} />
               </BarChart>
             </ResponsiveContainer>
          ) : (
             <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Loading velocity data...
             </div>
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        <div 
          onClick={() => setFilterCategory("All")}
          className={`menu-card ${filterCategory === "All" ? 'active' : ''}`} 
          style={{ padding: '15px', cursor: 'pointer', border: filterCategory === "All" ? '1px solid var(--accent-gold)' : '1px solid var(--glass-border)', background: filterCategory === "All" ? 'rgba(212,175,55,0.05)' : 'var(--glass-bg)' }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', marginBottom: '5px' }}>Total Burn</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{settings.currencySymbol}{expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</div>
        </div>
        {categories.map((cat) => {
          const catTotal = expenses
            .filter(e => e.category === cat.name)
            .reduce((sum, e) => sum + e.amount, 0);
          
          return (
            <div 
              key={cat.name} 
              onClick={() => setFilterCategory(cat.name)}
              className="menu-card" 
              style={{ 
                padding: '15px', 
                cursor: 'pointer',
                border: filterCategory === cat.name ? `1px solid ${cat.color}` : '1px solid var(--glass-border)',
                background: filterCategory === cat.name ? `${cat.color}10` : 'var(--glass-bg)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <cat.icon size={14} color={cat.color} />
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>{cat.name}</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{settings.currencySymbol}{catTotal.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
      
      {/* Search Bar */}
      <div style={{ marginBottom: '25px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search expenses by description..." 
          className="search-bar" 
          style={{ width: '100%', paddingLeft: '45px', background: 'var(--bg-surface)' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="responsive-table" style={{ display: 'flex', flexDirection: 'column', overflow: 'visible', borderRadius: '18px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', marginBottom: '50px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '15px' }}>Description</th>
                    <th style={{ padding: '15px' }}>Category</th>
                    <th style={{ padding: '15px' }}>Date</th>
                    <th style={{ padding: '15px' }}>Amount</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'var(--transition-smooth)' }}>
                      <td style={{ padding: '12px 15px', fontSize: '0.9rem', fontWeight: 500 }}>{e.description}</td>
                      <td style={{ padding: '12px 15px' }}>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                          {e.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{format(parseISO(e.timestamp || new Date().toISOString()), 'MMM dd, yyyy')}</td>
                      <td style={{ padding: '12px 15px', fontSize: '1rem', fontWeight: '800', color: '#f87171' }}>-{settings.currencySymbol}{e.amount.toFixed(2)}</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenModal(e)} className="tab" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', color: 'var(--accent-gold)' }}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="tab" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {filteredExpenses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No expenses found matching your criteria</div>
          )}
        </div>

        {/* Pagination Bar */}
        {filteredExpenses.length > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '12px 20px', 
            background: 'rgba(255,255,255,0.02)', 
            borderTop: '1px solid var(--glass-border)',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} entries
            </span>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
                className="tab"
                style={{ padding: '6px 12px', fontSize: '0.7rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                First
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className="tab"
                style={{ padding: '6px 12px', fontSize: '0.7rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Prev
              </button>
              
              {getPageNumbers().map((p, idx) => (
                p === '...' ? (
                  <span key={idx} style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>...</span>
                ) : (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(p)}
                    className={`tab ${currentPage === p ? 'active' : ''}`}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.7rem',
                      background: currentPage === p ? 'var(--accent-gold-soft)' : 'transparent',
                      borderColor: currentPage === p ? 'var(--accent-gold)' : 'var(--glass-border)',
                      color: currentPage === p ? 'var(--accent-gold)' : 'var(--text-white)'
                    }}
                  >
                    {p}
                  </button>
                )
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="tab"
                style={{ padding: '6px 12px', fontSize: '0.7rem', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages}
                className="tab"
                style={{ padding: '6px 12px', fontSize: '0.7rem', opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content" 
              style={{ width: '450px', textAlign: 'left', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', padding: '30px' }}
            >
              <h2 style={{ marginBottom: '25px', fontSize: '1.5rem', fontWeight: 800 }}>{editingExpense ? 'Modify Expense' : 'Log New Expense'}</h2>
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>DESCRIPTION</label>
                  <input 
                    {...register('description', { required: 'Description is required' })} 
                    className={`search-bar ${errors.description ? 'error' : ''}`} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }} 
                    placeholder="e.g. Monthly Rent" 
                  />
                  {errors.description && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.description.message}</span>}
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>CATEGORY</label>
                  <select {...register('category')} className="search-bar" style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }}>
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>DATE</label>
                  <input 
                    {...register('date')} 
                    type="date" 
                    className="search-bar" 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }} 
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>AMOUNT ({settings.currencySymbol})</label>
                  <input 
                    {...register('amount', { required: 'Amount is required', min: 0 })} 
                    type="number" 
                    step="0.01" 
                    className={`search-bar ${errors.amount ? 'error' : ''}`} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }} 
                  />
                  {errors.amount && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.amount.message}</span>}
                </div>
                <button type="submit" className="pay-button" style={{ marginTop: '15px', padding: '15px', fontSize: '1rem' }}>{editingExpense ? 'Confirm Changes' : 'Record Expense'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); reset(); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: '100%', marginTop: '10px', fontSize: '0.9rem' }}>Cancel</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminExpenses;
