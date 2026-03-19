using System.Collections.Generic;
using System.Collections.ObjectModel;
using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.TubeLook.Configuration;

/// <summary>
/// Plugin configuration.
/// </summary>
public class PluginConfiguration : BasePluginConfiguration
{
    /// <summary>
    /// Initializes a new instance of the <see cref="PluginConfiguration"/> class.
    /// </summary>
    public PluginConfiguration()
    {
    }

    /// <summary>
    /// Gets or sets the play button size.
    /// </summary>
    public int PlayButtonSize { get; set; } = 90;

    /// <summary>
    /// Gets or sets the skip button size.
    /// </summary>
    public int SkipButtonSize { get; set; } = 60;

    /// <summary>
    /// Gets or sets the rewind seconds.
    /// </summary>
    public int RewindSeconds { get; set; } = 10;

    /// <summary>
    /// Gets or sets the forward seconds.
    /// </summary>
    public int ForwardSeconds { get; set; } = 30;

    /// <summary>
    /// Gets or sets the auto hide delay.
    /// </summary>
    public int AutoHideDelay { get; set; } = 3000;

    /// <summary>
    /// Gets or sets a value indicating whether to enable double tap.
    /// </summary>
    public bool EnableDoubleTap { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to enable gestures.
    /// </summary>
    public bool EnableGestures { get; set; } = true;

    /// <summary>
    /// Gets or sets a value indicating whether to show visible skip buttons (YouTube-style: hide skip buttons, use double-tap gestures only).
    /// </summary>
    public bool ShowVisibleSkipButtons { get; set; } = false;

    /// <summary>
    /// Gets or sets the button opacity.
    /// </summary>
    public double ButtonOpacity { get; set; } = 0.7;

    /// <summary>
    /// Gets the user configurations.
    /// </summary>
    public Collection<UserConfigurationEntry> UserConfigurations { get; } = new();
}
