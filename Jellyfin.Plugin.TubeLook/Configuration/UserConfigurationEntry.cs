using System.Collections.ObjectModel;

namespace Jellyfin.Plugin.TubeLook.Configuration;

/// <summary>
/// Entry for user-specific configuration.
/// </summary>
public class UserConfigurationEntry
{
    /// <summary>
    /// Gets or sets the user ID.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the user configuration.
    /// </summary>
    public UserConfiguration? Config { get; set; }
}
