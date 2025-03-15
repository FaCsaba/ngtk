const std = @import("std");
const rl = @import("raylib");
const a = @import("./agent.zig");
const Agent = a.Agent;
const Color = a.Color;

pub fn main() !void {
    const screen_width = 800;
    const screen_height = 600;

    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();

    const agent = try Agent.init(allocator);
    defer agent.deinit();

    agent.set_color(Color.from_u32(0x1C1917FF), Color.from_u32(0xF2F2F2FF));

    try agent.resize(.{ .x = screen_width, .y = screen_height });
    _ = try agent.load_font(@embedFile("./DigitaltsLime.ttf"));

    try agent.add_text("Hello World");

    try agent.render_text();

    rl.initWindow(screen_width, screen_height, "Hello World");
    defer rl.closeWindow();

    const texture = try rl.Texture.fromImage(rl.Image{
        .data = agent.render_buffer.ptr,
        .width = agent.render_size.x,
        .height = agent.render_size.y,
        .format = .uncompressed_r8g8b8a8,
        .mipmaps = 1,
    });
    defer texture.unload();

    var last_key_pressed = rl.KeyboardKey.null;
    while (!rl.windowShouldClose()) {
        rl.beginDrawing();
        defer rl.endDrawing();

        const mods = get_key_mods();
        const char_pressed = rl.getCharPressed();
        var key_pressed = rl.getKeyPressed();
        const is_key_pressed_continue = key_pressed == .null and last_key_pressed != .null and rl.isKeyPressedRepeat(last_key_pressed);
        if (is_key_pressed_continue) key_pressed = last_key_pressed;

        if (key_pressed != .null or is_key_pressed_continue) {
            last_key_pressed = key_pressed;
            std.debug.print("Pressed: Key({s}) Unicode({u}) Mods({})\n", .{
                @tagName(key_pressed),
                @as(u21, @intCast(char_pressed)),
                mods,
            });
            input_handle: {
                switch (key_pressed) {
                    .backspace => {
                        agent.remove_char();
                        try agent.render_text();
                        rl.updateTexture(texture, agent.render_buffer.ptr);
                    },
                    .left_shift,
                    .left_control,
                    .left_alt,
                    .left_super,
                    .right_shift,
                    .right_control,
                    .right_alt,
                    .right_super,
                    => {},
                    else => {
                        //shortcuts
                        if (mods & @intFromEnum(KeyMod.Ctrl) > 0 and key_pressed == .c) {
                            var clipboard = std.ArrayList(u8).init(allocator);
                            defer clipboard.deinit();
                            const out: []u8 = try allocator.alloc(u8, 4);
                            defer allocator.free(out);
                            for (agent.text.items) |value| {
                                const len = try std.unicode.utf8Encode(value, out);
                                try clipboard.appendSlice(out[0..len]);
                            }
                            try clipboard.append(0);
                            rl.setClipboardText(clipboard.items[0 .. clipboard.items.len - 1 :0]);
                            break :input_handle;
                        }

                        if (mods & @intFromEnum(KeyMod.Ctrl) > 0 and key_pressed == .v) {
                            const clipboard = rl.getClipboardText();
                            try agent.add_text(clipboard);
                            try agent.render_text();
                            rl.updateTexture(texture, agent.render_buffer.ptr);
                            break :input_handle;
                        }

                        // normal keys
                        if (!try agent.put_key(mods, @intCast(char_pressed))) {
                            try agent.add_char(@intCast(char_pressed));
                        }
                        try agent.render_text();
                        rl.updateTexture(texture, agent.render_buffer.ptr);
                    },
                }
            }
        }

        texture.draw(0, 0, rl.Color.white);

        rl.drawFPS(50, 50);
    }
}

const KeyMod = enum(u8) {
    None = 0 << 0,
    Shift = 1 << 0,
    Ctrl = 1 << 1,
    Alt = 1 << 2,
};

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
