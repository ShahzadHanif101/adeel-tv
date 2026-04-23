const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables' 
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      message: 'Connected to Supabase!',
      channelCount: data.length,
      sampleData: data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
