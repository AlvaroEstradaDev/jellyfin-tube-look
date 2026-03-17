namespace Jellyfin.Plugin.TubeLook.Configuration;

/// <summary>
/// User-specific configuration overrides.
/// </summary>
public class UserConfiguration
{
    /// <summary>
    /// Gets or sets the play button size.
    /// </summary>
    public int? PlayButtonSize { get; set; }

    /// <summary>
    /// Gets or sets the skip button size.
    /// </summary>
    public int? SkipButtonSize { get; set; }

    /// <summary>
    /// Gets or sets the rewind seconds.
    /// </summary>
    public int? RewindSeconds { get; set; }

    /// <summary>
    /// Gets or sets the forward seconds.
    /// </summary>
    public int? ForwardSeconds { get; set; }

    /// <summary>
    /// Gets or sets the auto hide delay.
    /// </summary>
    public int? AutoHideDelay { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether to enable double tap.
    /// </summary>
    public bool? EnableDoubleTap { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether to enable gestures.
    /// </summary>
    public bool? EnableGestures { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether to show visible skip buttons (YouTube-style: hide skip buttons, use double-tap gestures only).
    /// </summary>
    public bool? ShowVisibleSkipButtons { get; set; }

    /// <summary>
    /// Gets or sets the button opacity.
    /// </summary>
    public double? ButtonOpacity { get; set; }
}
