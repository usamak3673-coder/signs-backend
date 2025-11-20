const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Connect Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Test route
app.get('/', (req, res) => res.send('Backend running!'));

// Add user after Lemon Squeezy purchase webhook
app.post('/add-user', async (req, res) => {
    const { email, name, plan_type } = req.body;
    const { data, error } = await supabase
        .from('users')
        .insert([{ email, name }])
        .select();

    if(error) return res.status(400).json({error});
    const user_id = data[0].id;

    const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .insert([{ user_id, plan_type, status: 'active' }]);

    if(subError) return res.status(400).json({subError});
    res.json({success: true});
});

app.listen(5000, () => console.log('Backend running on port 5000'));
pp.post('/webhook', async (req, res) => {
  try {
    const { email, name, plan_type } = req.body; // Data from Lemon Squeezy webhook

    // Check if user already exists
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let user_id;
    if (!user) {
      // Add new user
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([{ email, name }])
        .select();
      if (insertError) throw insertError;
      user_id = data[0].id;
    } else {
      user_id = user.id;
    }

    // Add subscription
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .insert([{ user_id, plan_type, status: 'active' }]);
    if (subError) throw subError;

    res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
});