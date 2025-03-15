const std = @import("std");
const fmt = std.fmt;
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const HashMap = std.AutoHashMap;

const tt = @cImport(@cInclude("stb/stb_truetype.h"));
const FontInfo = tt.stbtt_fontinfo;
const PackContext = tt.stbtt_pack_context;
const PackRange = tt.stbtt_pack_range;
const PackedChar = tt.stbtt_packedchar;
const init_font = tt.stbtt_InitFont;
const pack_begin = tt.stbtt_PackBegin;
const pack_font_ranges = tt.stbtt_PackFontRanges;
const pack_end = tt.stbtt_PackEnd;
const get_font_v_metrics = tt.stbtt_GetFontVMetrics;
const scale_for_mapping_em_to_pixels = tt.stbtt_ScaleForMappingEmToPixels;
const point_size = tt.STBTT_POINT_SIZE;
const get_font_bounding_box = tt.stbtt_GetFontBoundingBox;
const find_glyph_index = tt.stbtt_FindGlyphIndex;
const get_glyph_box = tt.stbtt_GetGlyphBox;
const pack_set_skip_missing_codepoints = tt.stbtt_PackSetSkipMissingCodepoints;
const get_glyph_kern_advance = tt.stbtt_GetGlyphKernAdvance;
const get_glyph_h_metrics = tt.stbtt_GetGlyphHMetrics;

const AgentError = error{
    InitFontFailed,
    FontNotFound,
    Packing,
    BitmapNotLoaded,
    IncorrectUnicode,
    CharacterNotFound,
};

const Point = struct {
    x: i32 = 0,
    y: i32 = 0,
};

const BoundingBox = struct {
    start: Point = .{},
    end: Point = .{},
};

const ExtPackedChar = struct {
    packed_char: PackedChar,
    glyph_index: i32,
    codepoint: u21,
};

const KeyMap = struct {
    mod: u8,
    key: u16,
};

pub const Font = struct {
    font_info: FontInfo,
    font_buf: []u8,
    font_size: f32,
    packed_chars: HashMap(u21, ExtPackedChar),
    atlas: []u8,
    atlas_size: Point,
    scale: f32,
    ascent: i32,
    descent: i32,
    vert_adv: i32,
    bounding_box: BoundingBox,
    key_mapping: ?HashMap(KeyMap, u21),
};

const DEFAULT_RENDER_SIZE: Point = .{ .x = 420, .y = 420 };
const DEFAULT_FONT_SIZE: f32 = 24;

// TODO: Introduce fallback font for when the user types something unexpected,
//       Maybe allow chaining to their default ime.
// TODO: Find a way to render svgs with color.
pub const Agent = struct {
    allocator: Allocator,
    render_size: Point,
    text: ArrayList(u21),
    rendered_text: []u8,
    font: ?Font,
    font_size: f32,

    pub fn init(allocator: Allocator) !*Agent {
        const a = try allocator.create(Agent);
        a.allocator = allocator;
        a.render_size = DEFAULT_RENDER_SIZE;
        a.text = ArrayList(u21).init(allocator);
        a.rendered_text = try allocator.alloc(u8, @intCast(a.render_size.x * a.render_size.y));
        a.font = null;
        a.font_size = DEFAULT_FONT_SIZE;

        return a;
    }

    fn get_key_mapping(self: *Agent, font_buf: []const u8) !?HashMap(KeyMap, u21) {
        const table = find_table(font_buf, "meta") orelse return null;
        var ngtk = find_in_meta_table(table, "Ngtk") orelse return null;
        const version = ngtk[0];
        if (version != 1) std.debug.panic("Expected ngtk version 1, got {} instead.", .{version});
        const key_map_length: usize = @intCast(get_u32(ngtk[1..]));

        const key_maps_offset: usize = 5;
        const key_map_size: usize = 7;

        var key_mapping = HashMap(KeyMap, u21).init(self.allocator);

        var i: usize = 0;
        while (i < key_map_length) {
            const loc: usize = key_maps_offset + key_map_size * i;
            const mod = ngtk[loc];
            const key = get_u16(ngtk[(loc+1)..]);
            const char: u21 = @intCast(get_u32(ngtk[(loc+3)..]));
            const key_map = KeyMap { .mod = mod, .key = key };
            try key_mapping.put(key_map, char);
            i += 1;
        }

        return key_mapping;
    }

    fn load_font_adv(self: *Agent, buf: []const u8, unicode_start: u32, num_chars: u32) !Font {
        var font_info: FontInfo = undefined;

        const font_buf = try self.allocator.dupe(u8, buf);

        if (init_font(&font_info, font_buf.ptr, 0) == 0) {
            return AgentError.InitFontFailed;
        }

        const key_mapping = try self.get_key_mapping(font_buf);
        const key_mapping_count = if (key_mapping) |km| km.count() else 0;

        const font_size = self.font_size;
        const scale = scale_for_mapping_em_to_pixels(&font_info, font_size);

        var bounding_box: BoundingBox = .{};
        get_font_bounding_box(&font_info, &bounding_box.start.x, &bounding_box.start.y, &bounding_box.end.x, &bounding_box.end.y);

        // TODO: Find a better way to figure out packing size. Maybe check if we failed packing and try again with a bigger array size.
        //       This might be why Firefox is failing.
        // TODO: Atlas size should be based on number of characters and the fontsize somehow
        const atlas_size = Point{ .x = 1024, .y = 1024 };

        var ctx: PackContext = undefined;
        const packed_chars_array = try self.allocator.alloc(PackedChar, @as(usize, @intCast(num_chars)) + key_mapping_count);
        defer self.allocator.free(packed_chars_array);
        const atlas = try self.allocator.alloc(u8, @intCast(atlas_size.x * atlas_size.y));
        pack_set_skip_missing_codepoints(&ctx, 0);
        if (pack_begin(
            &ctx,
            atlas.ptr,
            atlas_size.x,
            atlas_size.y,
            0,
            0,
            null,
        ) == 0) return AgentError.Packing;

        var range = PackRange{
            .font_size = point_size(self.font_size),
            .first_unicode_codepoint_in_range = @intCast(unicode_start),
            .num_chars = @intCast(num_chars),
            .chardata_for_range = packed_chars_array.ptr,
        };
        if (pack_font_ranges(
            &ctx,
            font_info.data,
            0,
            &range,
            1,
        ) == 0) return AgentError.Packing;

        if (key_mapping_count > 0) {
            var km_range = PackRange {
                .font_size = point_size(self.font_size),
                .first_unicode_codepoint_in_range = @intCast(0xE000),
                .num_chars = @intCast(key_mapping_count),
                .chardata_for_range = packed_chars_array[num_chars..].ptr,
            };
            if (pack_font_ranges(
                &ctx,
                font_info.data,
                0,
                &km_range,
                1,
            ) == 0) return AgentError.Packing;
        }

        pack_end(&ctx);

        var packed_chars = HashMap(u21, ExtPackedChar).init(self.allocator);
        var i: u32 = 0;
        while (i < num_chars) {
            const codepoint = unicode_start + i;
            const glyph_index = find_glyph_index(&font_info, @intCast(codepoint));
            var packed_char = packed_chars_array[@intCast(i)];
            if (codepoint == ' ') {
                var xadv: i32 = undefined;
                get_glyph_h_metrics(&font_info, glyph_index, &xadv, null);
                packed_char.xadvance = @as(f32, @floatFromInt(xadv))*scale;
            }
            const packed_char_ext: ExtPackedChar = .{
                .codepoint = @intCast(codepoint),
                .glyph_index = glyph_index,
                .packed_char = packed_char,
            };
            try packed_chars.put(@intCast(codepoint), packed_char_ext);
            i += 1;
        }

        i = 0;
        while (i < key_mapping_count) {
            const codepoint = 0xE000 + i;
            const glyph_index = find_glyph_index(&font_info, @intCast(codepoint));
            const packed_char = packed_chars_array[@intCast(num_chars + i)];
            const packed_char_ext: ExtPackedChar = .{
                .codepoint = @intCast(codepoint),
                .glyph_index = glyph_index,
                .packed_char = packed_char,
            };
            try packed_chars.put(@intCast(codepoint), packed_char_ext);
            i += 1;
        }

        var ascent: i32 = undefined;
        var descent: i32 = undefined;
        var line_gap: i32 = undefined;
        get_font_v_metrics(&font_info, &ascent, &descent, &line_gap);

        const font = Font{
            .font_info = font_info,
            .font_buf = font_buf,
            .font_size = font_size,
            .packed_chars = packed_chars,
            .atlas = atlas,
            .atlas_size = atlas_size,
            .bounding_box = bounding_box,
            .scale = scale,
            .ascent = ascent,
            .descent = descent,
            .vert_adv = ascent - descent + line_gap,
            .key_mapping = key_mapping,
        };

        return font;
    }

    pub fn load_font(self: *Agent, buf: []const u8) !Font {
        if (self.font) |font| self.unload_font(font);
        const font = try self.load_font_adv(buf, 1, 1024);
        self.font = font;
        return font;
    }

    pub fn unload_font(self: *Agent, font: Font) void {
        var chars = font.packed_chars;
        chars.deinit();
        var key_mapping = font.key_mapping;
        if (key_mapping) |*km| km.deinit();
        self.allocator.free(font.font_buf);
        self.allocator.free(font.atlas);
    }

    pub fn resize(self: *Agent, size: Point) !void {
        self.render_size = size;
        self.rendered_text = try self.allocator.realloc(self.rendered_text, @intCast(self.render_size.x * self.render_size.y));

    }

    pub fn render_text(self: *Agent) !void {
        self.clear_rendered_text();

        const font = self.font orelse return AgentError.FontNotFound;
        const ascent = font.ascent;
        const scale = font.scale;
        const baseline = @as(f32, @floatFromInt(ascent)) * scale;

        const width = self.render_size.x;
        const height = self.render_size.y;

        const padding = 10;

        var xpos: f32 = padding;
        const ypos: f32 = padding;

        var i: usize = 0;
        while (i < self.text.items.len) {
            const char = self.text.items[i];
            const packed_char = font.packed_chars.get(char) orelse font.packed_chars.get(32) orelse return AgentError.CharacterNotFound;

            const xadv: f32 = packed_char.packed_char.xadvance;
            const xoff: f32 = packed_char.packed_char.xoff;
            const yoff: f32 = packed_char.packed_char.yoff;

            // TODO: When the character wouldn't fit place it in a new line.

            // HACK: I am unable to verify whether whitespaces are supposed to have some data in font files to identify
            //       them as such, or are text rendering engines in charge of knowing that.
            if (!isWhitespace(char)) {
                const xatlas_end = packed_char.packed_char.x1;
                const yatlas_end = packed_char.packed_char.y1;

                var yrender: i32 = @intFromFloat(ypos + baseline + yoff);
                var yatlas = packed_char.packed_char.y0;
                while (yatlas < yatlas_end) {
                    if (yrender >= (height - padding) or yrender < 0) break;
                    var xrender: i32 = @intFromFloat(xpos + xoff);
                    var xatlas = packed_char.packed_char.x0;
                    while (xatlas < xatlas_end) {
                        if (xrender >= (width - padding) or xrender < 0) break;
                        self.rendered_text[@intCast(yrender * width + xrender)] |= font.atlas[@intCast(yatlas * font.atlas_size.x + xatlas)];

                        xrender += 1;
                        xatlas += 1;
                    }
                    yrender += 1;
                    yatlas += 1;
                }
            }

            // TODO: Support newline character.

            xpos += xadv;
            const next_char_maybe: ?u21 = if (i + 1 < self.text.items.len) self.text.items[i + 1] else null;
            if (next_char_maybe) |next_char| {
                const kern = @as(f32, @floatFromInt(get_glyph_kern_advance(&font.font_info, char, next_char))) * scale;
                xpos += kern;
            }
            i += 1;
        }
    }

    pub fn remove_char(self: *Agent) void {
        _ = self.text.popOrNull();
    }

    pub fn add_char(self: *Agent, char: u21) !void {
        try self.text.append(char);
    }

    pub fn add_text(self: *Agent, str: []const u8) !void {
        const utf8_view = std.unicode.Utf8View.init(str) catch return AgentError.IncorrectUnicode;
        var utf8_iter = utf8_view.iterator();
        while (utf8_iter.nextCodepoint()) |char| {
            try self.add_char(char);
        }
    }

    pub fn put_key(self: *Agent, mod: u8, key: u16) !void {
        const font = self.font orelse return;
        const key_mapping = font.key_mapping orelse return;
        const km = KeyMap { .mod = mod, .key = key };
        const char = key_mapping.get(km) orelse return;
        try self.add_char(char);
    }

    pub fn has_key(self: *Agent, mod: u8, key: u16) bool {
        const font = self.font orelse return false;
        const key_mapping = font.key_mapping orelse return false;
        const km = KeyMap { .mod = mod, .key = key };
        return key_mapping.contains(km);
    }

    pub fn deinit(self: *Agent) void {
        if (self.font) |font| self.unload_font(font);
        self.text.deinit();
        self.allocator.free(self.rendered_text);
        self.allocator.destroy(self);
    }

    fn clear_rendered_text(self: *Agent) void {
        var i: usize = 0;
        while (i < self.render_size.x * self.render_size.y) {
            self.rendered_text[i] = 0;
            i += 1;
        }
    }
};

fn get_u16(font_buf: []const u8) u16 {
    return (@as(u16, @intCast(font_buf[0])) << 8) +
        (@as(u16, @intCast(font_buf[1])) << 0);
}

fn get_u32(font_buf: []const u8) u32 {
    return (@as(u32, @intCast(font_buf[0])) << 24) +
        (@as(u32, @intCast(font_buf[1])) << 16) +
        (@as(u32, @intCast(font_buf[2])) << 8) +
        (@as(u32, @intCast(font_buf[3])) << 0);
}

fn is_tag(font_buf: []const u8, tag: []const u8) bool {
    return font_buf[0] == tag[0] and
        font_buf[1] == tag[1] and
        font_buf[2] == tag[2] and
        font_buf[3] == tag[3];
}

fn find_table(font_buf: []const u8, tag: []const u8) ?[]const u8 {
    const num_tables: usize = @intCast(get_u16(font_buf[4..]));
    const table_dir: usize = 12;
    const table_size: usize = 16;

    var i: usize = 0;
    while (i < num_tables) {
        const loc = table_dir + table_size * i;
        if (is_tag(font_buf[loc..], tag))
            return font_buf[@as(usize, @intCast(get_u32(font_buf[(loc + 8)..])))..];
        i += 1;
    }
    return null;
}

fn find_in_meta_table(meta_table: []const u8, tag: []const u8) ?[]const u8 {
    const num_data_maps_offset = 12;
    const num_data_maps: usize = @intCast(get_u32(meta_table[num_data_maps_offset..]));
    const data_maps_offset = 16;
    const data_map_size = 12;

    const data_offset_offset_in_data_map = 4;

    var i: usize = 0;
    while (i < num_data_maps) {
        const loc = data_maps_offset + data_map_size * i;
        if (is_tag(meta_table[loc..], tag)) {
            const offset: usize = @intCast(get_u32(meta_table[(loc + data_offset_offset_in_data_map)..]));
            return meta_table[offset..];
        }
        i += 1;
    }
    return null;
}

// TODO: Not an exhaustive list. https://en.wikipedia.org/wiki/Whitespace_character
const whitespace = [_]u21{
    ' ',
    '\t',
    '\n',
    '\r',
    std.ascii.control_code.vt,
    std.ascii.control_code.ff,
};

// Stolen directly from std.ascii.isWhitespace
fn isWhitespace(codepoint: u21) bool {
    return for (whitespace) |other| {
        if (codepoint == other) break true;
    } else false;
}

test "Agent" {
    const stbi_write_png = @cImport(@cInclude("stb/stb_image_write.h")).stbi_write_png;
    const alloc = std.testing.allocator;

    const agent = try Agent.init(alloc);
    defer agent.deinit();

    try agent.resize(.{ .x = 400, .y = 100 });

    const font_data = @embedFile("./DigitaltsLime.ttf");

    const font = try agent.load_font(font_data);

    const atlas_size = font.atlas_size;
    _ = stbi_write_png("font.png", atlas_size.x, atlas_size.y, 1, font.atlas.ptr, 0);

    const text = "Víztükör fúrógép őr?";
    try agent.add_text(text);
    try agent.render_text();

    _ = stbi_write_png("text.png", agent.render_size.x, agent.render_size.y, 1, agent.rendered_text.ptr, 0);
}

test "HashMaps with KeyMap keys" {
    const alloc = std.testing.allocator;

    var hm = HashMap(KeyMap, u21).init(alloc);
    defer hm.deinit();

    const km1 = KeyMap { .mod = 0, .key = 69 };
    try hm.put(km1, 34);

    const km2 = KeyMap { .mod = 0, .key = 69 };
    try std.testing.expect(hm.get(km2) == 34);
}