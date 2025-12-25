# OBS Studio WebSocket Integration Setup

The GOLS Widget can automatically control OBS Studio recordings when navigating between games. Here's how to set it up:

## Prerequisites

1. **OBS Studio** (version 28.0 or later recommended)
2. **OBS WebSocket Plugin** (built-in with OBS 28+, or install separately for older versions)

## Setup Instructions

### Step 1: Enable OBS WebSocket

#### For OBS Studio 28.0+:
1. Open OBS Studio
2. Go to **Tools** → **WebSocket Server Settings**
3. Check **"Enable WebSocket server"**
4. Note the **Server Port** (default: 4455)
5. Set a password if desired (optional but recommended)
6. Click **OK**

#### For OBS Studio 27.x and older:
1. Download and install the [OBS WebSocket plugin](https://github.com/obsproject/obs-websocket/releases)
2. Restart OBS Studio
3. Go to **Tools** → **WebSocket Server Settings**
4. Follow steps 3-6 above

### Step 2: Configure GOLS Widget

1. Open the GOLS Widget in your browser
2. Click the **Settings** (⚙️) button
3. In the **"OBS Studio Integration"** section:
   - Check **"Enable OBS Recording Control"**
   - Enter **WebSocket Host**: `localhost` (or the IP if OBS is on another computer)
   - Enter **WebSocket Port**: `4455` (or your custom port)
   - Enter **Password**: (if you set one in OBS)
4. Click **Save Settings**

## How It Works

When you press **"Save & Next Game"**:

1. **Stops** the current recording (if recording)
2. **Generates** a new filename based on game data:
   - Format: `{Event}_{GameNumber}_{Team1}_vs_{Team2}_{Date}`
   - Example: `Tournament_Game1_Thunder_vs_NORCO_20241224`
3. **Starts** a new recording with the new filename

## Recording File Names

Files are automatically named with this format:
```
{Event}_{GameNumber}_{Team1}_vs_{Team2}_{Date}
```

Examples:
- `Scoreboard_Game1_Orlando_Thunder_vs_NORCO_20241224`
- `Tournament_Game2_Eagles_vs_Warriors_20241224`

## Troubleshooting

### "Could not connect to OBS WebSocket"
- Make sure OBS Studio is running
- Verify WebSocket server is enabled in OBS
- Check that the host and port match your OBS settings
- If using a password, make sure it's correct

### "OBS error: Authentication failed"
- Check that the password in GOLS Widget matches OBS
- Try without a password first to test the connection

### "Recording fails to stop/start"
- Check OBS Studio for error messages
- Make sure you have write permissions to the recording folder
- Verify there's enough disk space

### Widget shows "OBS integration disabled"
- Make sure you've checked "Enable OBS Recording Control" in settings
- Verify and save your OBS settings in the widget

## Network Setup (Advanced)

If OBS Studio is running on a different computer:

1. Replace `localhost` with the computer's IP address
2. Make sure Windows Firewall allows the WebSocket port
3. Test the connection first with OBS WebSocket browser tools

## Security Notes

- The WebSocket connection is unencrypted
- Only use this on trusted networks
- Consider setting a strong password in OBS
- The password is stored in browser localStorage

## Support

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify OBS WebSocket plugin version compatibility
3. Test with the official OBS WebSocket test tools first