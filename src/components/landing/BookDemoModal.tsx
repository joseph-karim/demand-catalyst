import { useState, useEffect, useRef, type FormEvent } from 'react';

const HUBSPOT_PORTAL_ID = '24411875';
const HUBSPOT_FORM_ID = '02a0e618-cd42-4dbd-8381-e168aa403dad';
const MEETING_SLUG = 'joseph792';

const FREE_EMAIL_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com',
    'live.com', 'msn.com', 'me.com', 'mac.com', 'inbox.com', 'gmx.com',
    'fastmail.com', 'hey.com', 'pm.me', 'proton.me', 'tutanota.com',
    'yahoo.co.uk', 'googlemail.com', 'rocketmail.com', 'ymail.com'
]);

type ModalStep = 'form' | 'submitting' | 'scheduler';

export default function BookDemoModal() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<ModalStep>('form');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const dialogRef = useRef<HTMLDialogElement>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = () => {
            setOpen(true);
            setStep('form');
            setError('');
        };
        document.addEventListener('open-demo-modal', handler);
        return () => document.removeEventListener('open-demo-modal', handler);
    }, []);

    useEffect(() => {
        if (open) {
            dialogRef.current?.showModal();
            setTimeout(() => firstInputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            dialogRef.current?.close();
            document.body.style.overflow = '';
        }
    }, [open]);

    function closeModal() {
        setOpen(false);
        setStep('form');
        setFirstName('');
        setLastName('');
        setEmail('');
        setError('');
    }

    function handleBackdropClick(e: React.MouseEvent) {
        if (e.target === dialogRef.current) closeModal();
    }

    function isBusinessEmail(addr: string): boolean {
        const domain = addr.split('@')[1]?.toLowerCase();
        return !!domain && !FREE_EMAIL_DOMAINS.has(domain);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');

        const emailLower = email.trim().toLowerCase();

        if (!isBusinessEmail(emailLower)) {
            setError('Please use your business email. No Gmail, Yahoo, etc.');
            return;
        }

        setStep('submitting');

        try {
            const res = await fetch(
                `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fields: [
                            { name: 'firstname', value: firstName.trim() },
                            { name: 'lastname', value: lastName.trim() },
                            { name: 'email', value: emailLower }
                        ],
                        context: {
                            pageUri: window.location.href,
                            pageName: document.title
                        }
                    })
                }
            );

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const msg = data?.errors?.[0]?.message || 'Submission failed. Please try again.';
                setError(msg);
                setStep('form');
                return;
            }

            setStep('scheduler');
        } catch {
            setError('Connection error. Please try again.');
            setStep('form');
        }
    }

    const meetingUrl = `https://meetings.hubspot.com/${MEETING_SLUG}?embed=true&firstName=${encodeURIComponent(firstName.trim())}&lastName=${encodeURIComponent(lastName.trim())}&email=${encodeURIComponent(email.trim().toLowerCase())}`;

    if (!open) return null;

    return (
        <dialog
            ref={dialogRef}
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                margin: 0,
                padding: 0,
                border: 'none',
                background: 'rgba(26, 22, 18, 0.5)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200
            }}
        >
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: step === 'scheduler' ? '680px' : '440px',
                margin: '24px',
                boxShadow: '0 24px 80px rgba(26, 22, 18, 0.2)',
                overflow: 'hidden',
                animation: 'modalIn 0.3s ease-out',
                transition: 'max-width 0.3s ease',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column' as const
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 28px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexShrink: 0
                }}>
                    <div>
                        <p style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase' as const,
                            color: '#5a6340',
                            marginBottom: '8px'
                        }}>
                            {step === 'scheduler' ? 'Pick a time' : 'Book a demo'}
                        </p>
                        <h3 style={{
                            fontFamily: "'Fraunces Variable', serif",
                            fontSize: '24px',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            color: '#1a1612',
                            lineHeight: 1.2
                        }}>
                            {step === 'scheduler'
                                ? 'Schedule your demo.'
                                : 'See Bindtarget on your list.'
                            }
                        </h3>
                    </div>
                    <button
                        onClick={closeModal}
                        aria-label="Close"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: '#6b6560',
                            fontSize: '20px',
                            lineHeight: 1
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {step === 'scheduler' ? (
                    <div style={{
                        padding: '16px 28px 28px',
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column' as const
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            background: '#e6f5ee',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#1a6b4a',
                            flexShrink: 0
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                            Saved. Now pick a time that works for you.
                        </div>
                        <iframe
                            src={meetingUrl}
                            title="Schedule a demo"
                            style={{
                                width: '100%',
                                flex: 1,
                                minHeight: '520px',
                                border: 'none',
                                borderRadius: '8px'
                            }}
                        />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px' }}>
                        <p style={{
                            fontSize: '14px',
                            color: '#6b6560',
                            lineHeight: 1.6,
                            marginBottom: '24px'
                        }}>
                            We'll run Bindtarget on your actual prospect list. Takes 5 minutes.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div>
                                <label style={labelStyle}>First Name</label>
                                <input
                                    ref={firstInputRef}
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Jane"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Last Name</label>
                                <input
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Smith"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Business Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                placeholder="jane@youragency.com"
                                style={inputStyle}
                            />
                            <p style={{
                                fontSize: '12px',
                                color: '#8a956e',
                                marginTop: '6px'
                            }}>
                                Business email required. No Gmail, Yahoo, etc.
                            </p>
                        </div>

                        {error && (
                            <div style={{
                                padding: '10px 14px',
                                background: '#fef3ee',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#c4470a',
                                marginBottom: '16px'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={step === 'submitting'}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '14px 32px',
                                fontSize: '15px',
                                fontWeight: 600,
                                fontFamily: "'DM Sans Variable', sans-serif",
                                color: '#faf8f5',
                                background: step === 'submitting' ? '#ddd6cc' : '#c4470a',
                                border: 'none',
                                borderRadius: '100px',
                                cursor: step === 'submitting' ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            {step === 'submitting' ? (
                                <>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid rgba(250,248,245,0.3)',
                                        borderTopColor: '#faf8f5',
                                        borderRadius: '50%',
                                        animation: 'spin 0.6s linear infinite'
                                    }} />
                                    Submitting...
                                </>
                            ) : (
                                <>Book a Demo &rarr;</>
                            )}
                        </button>
                    </form>
                )}
            </div>

            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                dialog::backdrop {
                    background: transparent;
                }
            `}</style>
        </dialog>
    );
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1a1612',
    marginBottom: '6px'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    fontFamily: "'DM Sans Variable', sans-serif",
    color: '#1a1612',
    background: '#faf8f5',
    border: '1.5px solid #ddd6cc',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.2s'
};
