import os

file_path = "node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt"
with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
in_job_launch = False
brace_depth = 0
buffer_line = ""

for orig_line in lines:
    line = orig_line
    
    if ") =" in line and "scope.launch" in line:
        line = line.replace(") = scope.launch {", ") { scope.launch {")
        in_job_launch = True
        brace_depth = 0
    elif ") =" in line and "updateMetadataForTrack" in line:
        line = line.replace(") =", ") {")
        in_job_launch = True
        brace_depth = 0
        
    if in_job_launch:
        brace_depth += orig_line.count('{')
        brace_depth -= orig_line.count('}')
        
        new_lines.append(line)
        if brace_depth == 0:
            new_lines.append("    }\n")
            in_job_launch = False
    else:
        new_lines.append(line)

with open(file_path, "w") as f:
    f.writelines(new_lines)

print("Properly patched MusicModule.kt!")
