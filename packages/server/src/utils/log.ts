export function logInfo(...args: any){
  if(!process.env.DEBUG || process.env.DEBUG === 'false') 
    return;

  console.log('\x1b[36m[INFO]\x1b[0m', ...args);
}

export function logError(...args: any){
  if(!process.env.DEBUG || process.env.DEBUG === 'false') 
    return;
    
  console.error('\x1b[31m[INFO]\x1b[0m', ...args);
}