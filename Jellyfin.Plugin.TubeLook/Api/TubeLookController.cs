using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Jellyfin.Plugin.TubeLook.Configuration;
using MediaBrowser.Controller.Library;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.TubeLook.Api
{
    /// <summary>
    /// Controller for serving TubeLook resources and managing configuration.
    /// </summary>
    [ApiController]
    [Route("TubeLook")]
    public class TubeLookController : ControllerBase
    {
        private readonly IUserManager _userManager;

        /// <summary>
        /// Initializes a new instance of the <see cref="TubeLookController"/> class.
        /// </summary>
        /// <param name="userManager">The user manager.</param>
        public TubeLookController(IUserManager userManager)
        {
            _userManager = userManager;
        }

        /// <summary>
        /// Gets the TubeLook CSS.
        /// </summary>
        /// <returns>The CSS content.</returns>
        [HttpGet("css")]
        [Produces("text/css")]
        public IActionResult GetCss()
        {
            var css = GetEmbeddedResource("Web.tubelook.css");
            return Content(css, "text/css");
        }

        /// <summary>
        /// Gets the TubeLook JavaScript.
        /// </summary>
        /// <returns>The JavaScript content.</returns>
        [HttpGet("js")]
        [Produces("application/javascript")]
        public IActionResult GetJavaScript()
        {
            var js = GetEmbeddedResource("Web.tubelook.js");
            return Content(js, "application/javascript");
        }

        /// <summary>
        /// Gets the user's TubeLook configuration.
        /// </summary>
        /// <returns>The configuration JSON.</returns>
        [HttpGet("config")]
        [Produces("application/json")]
        public IActionResult GetConfig()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var serverConfig = Plugin.Instance!.Configuration;

            // Merge server defaults with user overrides
            var userConfig = new
            {
                PlayButtonSize = GetUserValue(
                    userId,
                    uc => uc.PlayButtonSize,
                    serverConfig.PlayButtonSize),
                SkipButtonSize = GetUserValue(
                    userId,
                    uc => uc.SkipButtonSize,
                    serverConfig.SkipButtonSize),
                RewindSeconds = GetUserValue(
                    userId,
                    uc => uc.RewindSeconds,
                    serverConfig.RewindSeconds),
                ForwardSeconds = GetUserValue(
                    userId,
                    uc => uc.ForwardSeconds,
                    serverConfig.ForwardSeconds),
                AutoHideDelay = GetUserValue(
                    userId,
                    uc => uc.AutoHideDelay,
                    serverConfig.AutoHideDelay),
                EnableDoubleTap = GetUserValue(
                    userId,
                    uc => uc.EnableDoubleTap,
                    serverConfig.EnableDoubleTap),
                EnableGestures = GetUserValue(
                    userId,
                    uc => uc.EnableGestures,
                    serverConfig.EnableGestures),
                ShowVisibleSkipButtons = GetUserValue(
                    userId,
                    uc => uc.ShowVisibleSkipButtons,
                    serverConfig.ShowVisibleSkipButtons),
                ButtonOpacity = GetUserValue(
                    userId,
                    uc => uc.ButtonOpacity,
                    serverConfig.ButtonOpacity)
            };

            return Ok(userConfig);
        }

        /// <summary>
        /// Updates the user's TubeLook configuration.
        /// </summary>
        /// <param name="config">The updated user configuration.</param>
        /// <returns>An <see cref="IActionResult"/> indicating success or failure.</returns>
        [HttpPost("config")]
        public IActionResult UpdateConfig([FromBody] UserConfiguration config)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var pluginConfig = Plugin.Instance!.Configuration;
            var existingEntry = pluginConfig.UserConfigurations.FirstOrDefault(e => e.UserId == userId);

            if (existingEntry != null)
            {
                existingEntry.Config = config;
            }
            else
            {
                pluginConfig.UserConfigurations.Add(new UserConfigurationEntry
                {
                    UserId = userId,
                    Config = config
                });
            }

            Plugin.Instance.SaveConfiguration();

            return Ok();
        }

        private T GetUserValue<T>(
            string? userId,
            Func<UserConfiguration, T?> selector,
            T defaultValue)
            where T : struct
        {
            if (!string.IsNullOrEmpty(userId))
            {
                var entry = Plugin.Instance!.Configuration.UserConfigurations
                    .FirstOrDefault(e => e.UserId == userId);
                if (entry?.Config != null)
                {
                    var value = selector(entry.Config);
                    if (value.HasValue)
                    {
                        return value.Value;
                    }
                }
            }

            return defaultValue;
        }

        private string GetEmbeddedResource(string resourceName)
        {
            var assembly = GetType().Assembly;
            var fullResourceName = $"Jellyfin.Plugin.TubeLook.{resourceName}";

            using var stream = assembly.GetManifestResourceStream(fullResourceName);
            if (stream == null)
            {
                return string.Empty;
            }

            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
    }
}
