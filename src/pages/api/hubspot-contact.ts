import type { APIRoute } from 'astro';

export const prerender = false;

const FREE_EMAIL_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com',
    'live.com', 'msn.com', 'me.com', 'mac.com', 'inbox.com', 'gmx.com',
    'fastmail.com', 'hey.com', 'pm.me', 'proton.me', 'tutanota.com',
    'yahoo.co.uk', 'googlemail.com', 'rocketmail.com', 'ymail.com'
]);

const MEETING_LINK = import.meta.env.HUBSPOT_MEETING_LINK || 'https://meetings.hubspot.com/joseph792';

function isBusinessEmail(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    return !FREE_EMAIL_DOMAINS.has(domain);
}

export const POST: APIRoute = async ({ request }) => {
    const apiKey = import.meta.env.HUBSPOT_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'HubSpot API key not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let body: { firstName?: string; lastName?: string; email?: string };
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { firstName, lastName, email } = body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
        return new Response(JSON.stringify({ error: 'First name, last name, and email are required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const emailLower = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
        return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (!isBusinessEmail(emailLower)) {
        return new Response(JSON.stringify({ error: 'Please use your business email address.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Create contact in HubSpot
    try {
        const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    firstname: firstName.trim(),
                    lastname: lastName.trim(),
                    email: emailLower
                }
            })
        });

        if (createRes.status === 409) {
            // Contact already exists — that's fine, update them
            const conflict = await createRes.json();
            const existingId = conflict?.message?.match(/ID:\s*(\d+)/)?.[1];
            if (existingId) {
                await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        properties: {
                            firstname: firstName.trim(),
                            lastname: lastName.trim()
                        }
                    })
                });
            }
        } else if (!createRes.ok) {
            const err = await createRes.json();
            console.error('HubSpot create error:', err);
            return new Response(JSON.stringify({ error: 'Failed to save contact. Please try again.' }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (err) {
        console.error('HubSpot API error:', err);
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please try again.' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Build meeting link with pre-filled contact info
    const meetingUrl = new URL(MEETING_LINK);
    meetingUrl.searchParams.set('email', emailLower);
    meetingUrl.searchParams.set('firstName', firstName.trim());
    meetingUrl.searchParams.set('lastName', lastName.trim());

    return new Response(JSON.stringify({
        success: true,
        meetingUrl: meetingUrl.toString()
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
