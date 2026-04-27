import React from 'react';
import { Coffee } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useKachinoStore } from '../store/useKachinoStore';

const Receipt = ({ order }) => {
  const { settings, customers } = useKachinoStore();
  const customer = order.customerId ? customers.find(c => c.id === order.customerId) : null;
  const store = settings?.storeInfo || {};
  if (!order) return null;

  return (
    <div className="receipt-view" style={{ 
      textAlign: 'center', 
      padding: '30px 20px', 
      color: '#1a1a1a', 
      background: '#ffffff',
      fontFamily: "'Courier New', Courier, monospace",
      maxWidth: '380px',
      margin: '0 auto',
      boxShadow: '0 0 40px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '25px' }}>
        {store.logoUrl ? (
          <img src={store.logoUrl} alt="Logo" style={{ width: '60px', height: '60px', marginBottom: '10px', objectFit: 'contain' }} />
        ) : (
          <Coffee size={32} color="#000" style={{ marginBottom: '10px' }} />
        )}
        <h2 style={{ fontSize: '1.4rem', margin: '5px 0', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>{store.name || 'Cafe Kachino'}</h2>
        <p style={{ fontSize: '0.75rem', marginBottom: '4px' }}>{store.welcomeMsg || 'Artisanal Roastery & Patisserie'}</p>
        <p style={{ fontSize: '0.7rem' }}>{store.address || 'Street Address, City'}</p>
        <p style={{ fontSize: '0.7rem' }}>TEL: {store.phone || 'Phone'}</p>
      </div>

      {/* Dining Mode Header */}
      <div style={{ 
        background: '#000', 
        color: '#fff', 
        padding: '8px', 
        fontSize: '1rem', 
        fontWeight: 'bold', 
        textTransform: 'uppercase',
        marginBottom: '20px'
      }}>
        {order.diningMode === 'dinein' ? `Dine-in (Table #${order.tableNumber})` : 'Take-away'}
      </div>

      <div style={{ borderTop: '2px dashed #000', margin: '15px 0' }}></div>

      {/* Order Info */}
      <div style={{ textAlign: 'left', fontSize: '0.75rem', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>ORDER ID:</span>
          <span style={{ fontWeight: 'bold' }}>#{order.id?.toString().slice(-8)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>DATE:</span>
          <span>{format(parseISO(order.timestamp), 'dd/MM/yyyy HH:mm')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>CASHIER:</span>
          <span>{order.processedBy || 'Manager'}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '15px 0' }}></div>

      {/* Items Table */}
      <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <th style={{ paddingBottom: '8px', fontWeight: 'bold' }}>ITEM</th>
            <th style={{ paddingBottom: '8px', textAlign: 'right', fontWeight: 'bold' }}>PRICE</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                {item.modifiers && (
                  <div style={{ fontSize: '0.65rem', color: '#666', fontStyle: 'italic', marginBottom: '2px' }}>
                    {[
                      item.modifiers.ice && `Ice: ${item.modifiers.ice}`,
                      item.modifiers.sugar && `Sugar: ${item.modifiers.sugar}`
                    ].filter(Boolean).join(' • ')}
                  </div>
                )}
                <div style={{ fontSize: '0.7rem', color: '#666' }}>QTY: {item.quantity} × {settings.currencySymbol || '$'}{item.price.toFixed(2)}</div>
              </td>
              <td style={{ padding: '8px 0', textAlign: 'right', verticalAlign: 'top' }}>
                {settings.currencySymbol || '$'}{(item.price * item.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', margin: '15px 0' }}></div>

      {/* Financials */}
      <div style={{ fontSize: '0.85rem', textAlign: 'right' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>SUBTOTAL:</span>
          <span>{settings.currencySymbol || '$'}{order.subtotal?.toFixed(2)}</span>
        </div>
        {(order.discount || 0) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#000' }}>
            <span>DISCOUNT:</span>
            <span>-{settings.currencySymbol || '$'}{order.discount?.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>TAX:</span>
          <span>{settings.currencySymbol || '$'}{order.tax?.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', borderTop: '2px solid #000', paddingTop: '10px' }}>
          <span>TOTAL:</span>
          <span>{settings.currencySymbol || '$'}{order.total?.toFixed(2)}</span>
        </div>
        
        <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>PAYMENT METHOD:</span>
            <span style={{ textTransform: 'uppercase' }}>{order.paymentMethod}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>AMOUNT PAID:</span>
            <span>{settings.currencySymbol || '$'}{order.amountPaid?.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <span>CHANGE DUE:</span>
            <span>{settings.currencySymbol || '$'}{order.change?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {customer && (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #000', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '5px' }}>CUSTOMER: {customer.name.toUpperCase()}</div>
            <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>LOYALTY POINTS:</span>
                <span style={{ fontWeight: 'bold' }}>{customer.points} (+{Math.floor(order.total / (settings.loyalty?.spendPerPoint || 1000))})</span>
            </div>
        </div>
      )}

      <div style={{ borderTop: '2px dashed #000', margin: '20px 0' }}></div>

      {/* Footer */}
      <div style={{ fontSize: '0.7rem' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{settings.footerMsg || 'THANK YOU FOR YOUR VISIT'}</p>
        <p style={{ marginBottom: '15px' }}>Fiscal ID: {settings.fiscalId || 'N/A'} • Follow us @CafeKachino</p>
        
        {/* Mock Barcode */}
        <div style={{ display: 'flex', justifyContent: 'center', height: '30px', gap: '2px', opacity: 0.8 }}>
          {[2,4,1,3,2,1,5,2,4,1,3,2,1,4,2,3].map((h, i) => (
            <div key={i} style={{ width: h > 3 ? '2px' : '1px', height: '100%', background: '#000' }}></div>
          ))}
        </div>
        <p style={{ fontSize: '0.6rem', marginTop: '5px' }}>{order.id}</p>
      </div>
    </div>
  );
};

export default Receipt;
