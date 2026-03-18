import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Link2, Check, ExternalLink, RefreshCw, MessageCircle, Loader2, Bot } from 'lucide-react';
import { setZohoRefreshToken } from '@/hooks/use-zoho-sync';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

export default function AdminSettings() {
  const [zohoRefreshToken, setZohoToken] = useState('');
  const [isZohoConnected, setIsZohoConnected] = useState(false);

  // WhatsApp API state
  const [waAccessToken, setWaAccessToken] = useState('');
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waBusinessId, setWaBusinessId] = useState('');
  const [isWaConnected, setIsWaConnected] = useState(false);
  const [isWaSaving, setIsWaSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('zoho_refresh_token');
    if (token) {
      setZohoToken(token);
      setIsZohoConnected(true);
    }
    // Check WhatsApp connection
    checkWhatsAppConnection();
  }, []);

  const checkWhatsAppConnection = async () => {
    try {
      const { data } = await supabase
        .from('api_keys_vault')
        .select('key_name')
        .eq('service_type', 'whatsapp')
        .eq('is_active', true);
      if (data && data.length > 0) {
        setIsWaConnected(true);
      }
    } catch (e) {
      console.error('Error checking WhatsApp connection:', e);
    }
  };

  const handleWhatsAppSave = async () => {
    if (!waAccessToken.trim() || !waPhoneNumberId.trim()) {
      toast.error('Access Token and Phone Number ID are required');
      return;
    }
    setIsWaSaving(true);
    try {
      // Upsert access token
      const { error: e1 } = await supabase.from('api_keys_vault').upsert({
        key_name: 'WHATSAPP_ACCESS_TOKEN',
        key_value: waAccessToken.trim(),
        service_type: 'whatsapp',
        description: 'WhatsApp Cloud API Access Token',
        is_active: true,
      }, { onConflict: 'key_name' });

      // Upsert phone number ID
      const { error: e2 } = await supabase.from('api_keys_vault').upsert({
        key_name: 'WHATSAPP_PHONE_ID',
        key_value: waPhoneNumberId.trim(),
        service_type: 'whatsapp',
        description: 'WhatsApp Phone Number ID',
        is_active: true,
      }, { onConflict: 'key_name' });

      // Upsert business ID if provided
      if (waBusinessId.trim()) {
        await supabase.from('api_keys_vault').upsert({
          key_name: 'WHATSAPP_BUSINESS_ID',
          key_value: waBusinessId.trim(),
          service_type: 'whatsapp',
          description: 'WhatsApp Business Account ID',
          is_active: true,
        }, { onConflict: 'key_name' });
      }

      if (e1 || e2) throw new Error(e1?.message || e2?.message);

      setIsWaConnected(true);
      setWaAccessToken('');
      setWaPhoneNumberId('');
      setWaBusinessId('');
      toast.success('WhatsApp API credentials saved! AI bot is now active on your WhatsApp number.');
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setIsWaSaving(false);
    }
  };

  const handleWhatsAppDisconnect = async () => {
    try {
      await supabase.from('api_keys_vault').update({ is_active: false }).eq('service_type', 'whatsapp');
      setIsWaConnected(false);
      toast.success('WhatsApp API disconnected. AI bot will no longer auto-reply.');
    } catch (err: any) {
      toast.error('Failed to disconnect: ' + err.message);
    }
  };

  const handleZohoConnect = () => {
    if (!zohoRefreshToken.trim()) {
      toast.error('Please enter a valid refresh token');
      return;
    }
    setZohoRefreshToken(zohoRefreshToken);
    setIsZohoConnected(true);
    toast.success('Zoho CRM connected successfully!');
  };

  const handleZohoDisconnect = () => {
    localStorage.removeItem('zoho_refresh_token');
    setZohoToken('');
    setIsZohoConnected(false);
    toast.success('Zoho CRM disconnected');
  };

  const getZohoAuthUrl = () => {
    const clientId = import.meta.env.VITE_ZOHO_CLIENT_ID || '1000.G8JYUA03KOBLX2OMDTC924YVJBLDMC';
    const redirectUri = encodeURIComponent(window.location.origin + '/admin/settings');
    const scope = encodeURIComponent('ZohoCRM.modules.ALL,ZohoCRM.settings.ALL');
    return `https://accounts.zoho.com/oauth/v2/auth?scope=${scope}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${redirectUri}&prompt=consent`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Configure integrations and store settings</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="store">Store Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {/* Zoho CRM Integration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-500 font-bold text-sm">Z</span>
                    </div>
                    <div>
                      <CardTitle>Zoho CRM</CardTitle>
                      <CardDescription>Sync customers, orders, and leads</CardDescription>
                    </div>
                  </div>
                  {isZohoConnected && (
                    <span className="flex items-center gap-1 text-sm text-green-500">
                      <Check className="h-4 w-4" />
                      Connected
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zoho-token">Refresh Token</Label>
                  <Input
                    id="zoho-token"
                    type="password"
                    placeholder="Enter your Zoho refresh token"
                    value={zohoRefreshToken}
                    onChange={(e) => setZohoToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your refresh token from the Zoho API Console after OAuth authorization.
                  </p>
                </div>

                <div className="flex gap-2">
                  {!isZohoConnected ? (
                    <>
                      <Button onClick={handleZohoConnect} className="btn-sunset">
                        <Link2 className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={getZohoAuthUrl()} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Get Auth Code
                        </a>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleZohoConnect}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Token
                      </Button>
                      <Button variant="destructive" onClick={handleZohoDisconnect}>
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>

                {isZohoConnected && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Automatic Sync</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      When connected, the following data syncs automatically:
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• New customers → Zoho Contacts</li>
                      <li>• Orders → Zoho Deals (with status updates)</li>
                      <li>• Contact form submissions → Zoho Leads</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* WhatsApp API Integration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="glass-card border-green-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        WhatsApp AI Bot
                        <Badge variant="outline" className="text-xs">
                          <Bot className="h-3 w-3 mr-1" />
                          Auto-Reply
                        </Badge>
                      </CardTitle>
                      <CardDescription>Connect your WhatsApp Business API for AI-powered auto-replies</CardDescription>
                    </div>
                  </div>
                  {isWaConnected && (
                    <span className="flex items-center gap-1 text-sm text-green-500">
                      <Check className="h-4 w-4" />
                      Connected
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isWaConnected ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="wa-token">Access Token *</Label>
                      <Input
                        id="wa-token"
                        type="password"
                        placeholder="Your WhatsApp Cloud API access token"
                        value={waAccessToken}
                        onChange={(e) => setWaAccessToken(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wa-phone-id">Phone Number ID *</Label>
                      <Input
                        id="wa-phone-id"
                        placeholder="e.g. 581011471770928"
                        value={waPhoneNumberId}
                        onChange={(e) => setWaPhoneNumberId(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wa-business-id">Business Account ID (optional)</Label>
                      <Input
                        id="wa-business-id"
                        placeholder="e.g. 123456789"
                        value={waBusinessId}
                        onChange={(e) => setWaBusinessId(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get these from your Meta Business Suite → WhatsApp → API Setup. 
                      The webhook URL is: <code className="bg-muted px-1 rounded text-xs">
                        {`https://ewmgcqblkcdcgyjbvgtp.supabase.co/functions/v1/whatsapp-webhook`}
                      </code>
                    </p>
                    <Button onClick={handleWhatsAppSave} disabled={isWaSaving} className="btn-sunset">
                      {isWaSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
                      Connect & Enable AI Bot
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                      <h4 className="font-medium flex items-center gap-2">
                        <Bot className="h-4 w-4" /> AI Bot Active
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Your WhatsApp number is connected. The AI bot will automatically reply to incoming text messages 
                        using your <strong>Knowledge Base</strong> content.
                      </p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Incoming text messages → AI auto-reply with knowledge base context</li>
                        <li>• Conversation history maintained per contact</li>
                        <li>• All messages logged in WhatsApp Inbox</li>
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsWaConnected(false)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Credentials
                      </Button>
                      <Button variant="destructive" onClick={handleWhatsAppDisconnect}>
                        Disconnect
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Other Integrations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-500 font-bold text-sm">PF</span>
                  </div>
                  <div>
                    <CardTitle>PayFast</CardTitle>
                    <CardDescription>Payment gateway for South African Rand</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  Configured via environment secrets
                </span>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-500 font-bold text-sm">Y</span>
                  </div>
                  <div>
                    <CardTitle>Yoco</CardTitle>
                    <CardDescription>Alternative payment gateway</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  Configured via environment secrets
                </span>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-500 font-bold text-sm">CG</span>
                  </div>
                  <div>
                    <CardTitle>The Courier Guy</CardTitle>
                    <CardDescription>Shipping and delivery integration</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  Configured via environment secrets
                </span>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="store" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Basic store settings and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Store Name</Label>
                  <Input defaultValue="African Vibe" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input defaultValue="orders@proagrisa.co.za" />
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Input defaultValue="ZAR" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Currency</Label>
                  <Input defaultValue="USD" disabled />
                </div>
              </div>
              <Button className="btn-sunset">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure automated email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Order Confirmations</p>
                    <p className="text-sm text-muted-foreground">Send to customers after purchase</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Shipping Updates</p>
                    <p className="text-sm text-muted-foreground">Notify when order ships</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert admins when stock is low</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">New Order Alerts</p>
                    <p className="text-sm text-muted-foreground">Send to admin email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-5 w-5" />
                </label>
              </div>
              <Button className="btn-sunset">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
