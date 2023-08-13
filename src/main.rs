use std::process::exit;
use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};
use scan_dir::ScanDir;
use v8::Map;
use walkdir::WalkDir;
use std::fs;
use std::env;

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

async fn manual_hello() -> impl Responder {
    println!("Hello");
    HttpResponse::Ok().body("Hey there!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let platform = v8::new_default_platform(0, false).make_shared();
    v8::V8::initialize_platform(platform);
    v8::V8::initialize();
    let isolate = &mut v8::Isolate::new(Default::default());

    let scope = &mut v8::HandleScope::new(isolate);
    let context = v8::Context::new(scope);
    let scope = &mut v8::ContextScope::new(scope, context);



    let code = v8::String::new(scope, " 'Hello' + ' World!' + Math.random();var exports ={}; var require = () => {}").unwrap();
    println!("javascript code: {}", code.to_rust_string_lossy(scope));

    let script =  v8::Script::compile(scope, code, None).unwrap();

    let result =match script.run(scope) {
        Some(a)  => a,
        None => exit(0),
    };


    let result = result.to_string(scope).unwrap();
    println!("result: {}", result.to_rust_string_lossy(scope));

    // ScanDir::dirs().read(".", |iter| {
    //     for (entry, name) in iter {
    //         println!("File {:?} has full path {:?}", name, entry.path());
    //     }
    // }).unwrap();

    // implicit_args: *mut Opaque,
    // values: *const Value,
    // length: int,
    // let jsFuncRequire = v8::FunctionTemplate::new(scope, | info: v8::FunctionCallbackInfo |  {
    //     println!("Called require()");
    // } );


    // let files: Vec<_> = ScanDir::files().read("dist/cjs", |iter| {
    //     iter.filter(|&(_, ref name)| name.ends_with(".js"))
    //         .map(|(entry, _)| entry.path())
    //         .collect()
    // }).unwrap();
    //
    // println!("Files {:?}", files);

    // let mut files : Vec<str> = Vec{str};

    for entry in WalkDir::new("./dist/cjs")
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok()) {
        let f_name = entry.file_name().to_string_lossy();
        let sec = entry.metadata()?.modified()?;

        if f_name.ends_with(".js")   {
            println!("{}", entry.path().to_string_lossy());


            let contents = fs::read_to_string(entry.path().to_string_lossy().to_string())
                .expect("Failed to read file");

            let code = v8::String::new(scope, &contents.to_string()).unwrap();
            let script =  v8::Script::compile(scope, code, None).unwrap();


            let result =match script.run(scope) {
                Some(a)  => a,
                None => exit(0),
            };
            println!("result: {}", result.to_rust_string_lossy(scope));
            // println!("With text:\n{}", contents);
        }
    }


    HttpServer::new(|| {
        App::new()
            .service(hello)
            .service(echo)
            .route("/hey", web::get().to(manual_hello))
    })
        .bind(("127.0.0.1", 8080))?
        .run()
        .await
}