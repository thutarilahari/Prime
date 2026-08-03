import { execSync } from 'child_process';
import fs from 'fs';

const input = 'C:\\Users\\valla\\OneDrive\\Desktop\\Delta\\Day - 01 (07_06_23)\\04. Introduction\\01. Welcome to Delta!.mp4';
const output = 'C:\\Users\\valla\\OneDrive\\Desktop\\LEARNER\\test_out.mp4';

console.time('remux');
execSync(`ffmpeg -i "${input}" -c copy -y "${output}"`);
console.timeEnd('remux');

const stat = fs.statSync(output);
console.log('Output file size:', stat.size);
