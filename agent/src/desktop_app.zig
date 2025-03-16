const std = @import("std");
const Allocator = std.mem.Allocator;
const rl = @import("raylib");
const a = @import("./agent.zig");
const Agent = a.Agent;
const AgentInitExt = a.AgentInitExt;
const Color = a.Color;
const log = std.log.scoped(.app);

const screen_width = 800;
const screen_height = 600;

const KeyPressed = struct {
    mods: u8 = 0,
    key: rl.KeyboardKey = rl.KeyboardKey.null,
    unicode: u21 = 0,
};

const KeyMod = enum(u8) {
    None = 0 << 0,
    Shift = 1 << 0,
    Ctrl = 1 << 1,
    Alt = 1 << 2,

    pub fn in(self: KeyMod, mods: u8) bool {
        return @intFromEnum(self) & mods > 0;
    }
};

const Dirty = union(enum) {
    key_pressed,
    new_neography,
    clean,
};

fn log_error(failure: []const u8, err: anyerror) anyerror {
    log.err("{s}. Reason: {s}", .{ failure, @errorName(err) });
    return err;
}

const App = struct {
    allocator: Allocator,
    agent: *Agent,
    texture: rl.Texture,
    last_key: ?KeyPressed = null,
    dirty: Dirty = .clean,

    pub fn init(allocator: Allocator) !App {
        const ext: AgentInitExt = .{
            .bg_color = Color.from_u32(0x1C1917FF),
            .fg_color = Color.from_u32(0xF2F2F2FF),
            .render_size = .{ .x = screen_width, .y = screen_height },
        };
        const agent = Agent.init(allocator, ext) catch |err| return log_error("Failed to create Agent", err);

        agent.add_text("Hello, World!") catch |err| return log_error("Failed to write initial text", err);
        _ = agent.load_font(@embedFile("FiraSansMedium.ttf")) catch |err| return log_error("Faild to load initial font", err);
        agent.render_text() catch |err| return log_error("Failed to render initial text", err);

        const texture = rl.Texture.fromImage(rl.Image{
            .data = agent.render_buffer.ptr,
            .width = agent.render_size.x,
            .height = agent.render_size.y,
            .format = .uncompressed_r8g8b8a8,
            .mipmaps = 1,
        }) catch |err| return log_error("Failed to upload agent render buffer to texture", err);

        return .{ .allocator = allocator, .agent = agent, .texture = texture };
    }

    pub fn deinit(self: *App) void {
        self.texture.unload();
        self.agent.deinit();
    }

    pub fn update(self: *App) !void {
        self.dirty = .clean;
        try self.update_new_neography();
        try self.update_key_press();
    }

    fn update_new_neography(self: *App) !void {
        if (rl.isFileDropped()) {
            const files = rl.loadDroppedFiles();
            defer rl.unloadDroppedFiles(files);
            if (files.count < 1) {
                log.err("Failed to load neography, could not get file path", .{});
                return;
            }
            const file_path = files.paths[0];
            if (file_path == null) {
                log.err("Failed to load neography, got null ptr for file path", .{});
                return;
            }
            log.info("Dropped new neography file: {s}\n", .{file_path});
            const file = std.fs.openFileAbsoluteZ(file_path, .{
                .allow_ctty = false,
                .lock = .none,
                .lock_nonblocking = false,
                .mode = .read_only,
            }) catch |err| return log_error("Failed to load neography, couldn't open dropped file", err);
            const content = file.readToEndAlloc(self.allocator, std.math.maxInt(usize)) catch |err| return log_error("Failed to load neography, coudn't read dropped file", err);
            _ = self.agent.load_font(content) catch |err| return log_error("Failed to load neography", err);
            self.dirty = .new_neography;
        }
    }

    fn update_key_press(self: *App) !void {
        const key = if (self.get_key_pressed()) |key| key else return;
        log.info("Pressed key: {}", .{key});

        switch (key.key) {
            .backspace => {
                self.agent.remove_char();
                self.dirty = .key_pressed;
            },
            else => {
                // shortcuts
                if (KeyMod.Ctrl.in(key.mods) and key.key == .c) {
                    // ctrl + c
                    var clipboard = std.ArrayList(u8).init(self.allocator);
                    defer clipboard.deinit();
                    var out: [4]u8 = undefined;
                    for (self.agent.text.items) |value| {
                        const len = std.unicode.utf8Encode(value, &out) catch |err| {
                            log.err("Failed to encode unicode codepoint 0x{x} into UTF-8. Reason: {s}", .{ value, @errorName(err) });
                            return err;
                        };
                        clipboard.appendSlice(out[0..len]) catch |err| return log_error("Failed to append UTF-8 characters to clipboard buffer", err);
                    }
                    clipboard.append(0) catch |err| return log_error("Failed to append sentinel to clipboard buffer", err);
                    rl.setClipboardText(clipboard.items[0 .. clipboard.items.len - 1 :0]);
                } else if (KeyMod.Ctrl.in(key.mods) and key.key == .v) {
                    // ctrl + v
                    const clipboard = rl.getClipboardText();
                    self.agent.add_text(clipboard) catch |err| return log_error("Failed to add clipboard contents to agent", err);
                    self.dirty = .key_pressed;
                } else {
                    // normal keys
                    const has_key = self.agent.put_key(key.mods, @intCast(@intFromEnum(key.key))) catch |err| return log_error("Failed to put key to agent", err);
                    if (!has_key and key.unicode != 0) {
                        self.agent.add_char(@intCast(key.unicode)) catch |err| return log_error("Failed to put unicode character to agent", err);
                    }
                    self.dirty = .key_pressed;
                }
            },
        }
    }

    fn get_key_pressed(self: *App) ?KeyPressed {
        const key: KeyPressed = .{
            .mods = get_key_mods(),
            .key = rl.getKeyPressed(),
            .unicode = @intCast(rl.getCharPressed()),
        };
        if (key.key == .null) {
            if (self.last_key) |last_key| {
                if (rl.isKeyPressedRepeat(last_key.key)) return last_key;
            }
            return null;
        }
        self.last_key = key;
        return key;
    }

    pub fn draw(self: App) !void {
        if (self.dirty != .clean) {
            self.agent.render_text() catch |err| return log_error("Failed to render text", err);
            rl.updateTexture(self.texture, self.agent.render_buffer.ptr);
        }
        self.texture.draw(0, 0, rl.Color.white);
        rl.drawFPS(50, 50);
    }

    fn get_key_mods() u8 {
        const is_shift = rl.isKeyDown(.left_shift) or rl.isKeyDown(.right_shift);
        const is_ctrl = rl.isKeyDown(.left_control) or rl.isKeyDown(.right_control);
        const is_alt = rl.isKeyDown(.left_alt) or rl.isKeyDown(.right_alt);

        var mods = @intFromEnum(KeyMod.None);
        if (is_shift) mods |= @intFromEnum(KeyMod.Shift);
        if (is_ctrl) mods |= @intFromEnum(KeyMod.Ctrl);
        if (is_alt) mods |= @intFromEnum(KeyMod.Alt);
        return mods;
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();
    defer _ = gpa.deinit();

    rl.initWindow(screen_width, screen_height, "NGTK");
    defer rl.closeWindow();

    var app = try App.init(allocator);
    defer app.deinit();

    while (!rl.windowShouldClose()) {
        rl.beginDrawing();
        defer rl.endDrawing();

        // ignoring errors, the show must go on
        app.update() catch {};
        app.draw() catch {};
    }
}
