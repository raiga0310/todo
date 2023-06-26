mod handlers;
mod repositories;

use crate::repositories::{
    label::LabelRepositoryforDB,
    todo::{TodoRepository, TodoRepositoryForDB},
};
use axum::{
    extract::Extension,
    http::HeaderValue,
    routing::{delete, get, post},
    Router,
};
use dotenv::dotenv;
use handlers::{
    label::{all_label, create_label, delete_label},
    todo::{all_todo, create_todo, delete_todo, find_todo, update_todo},
};
use hyper::header::CONTENT_TYPE;
use repositories::label::LabelRepository;
use sqlx::PgPool;
use std::net::SocketAddr;
use std::{env, sync::Arc};
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() {
    let log_level = env::var("RUST_LOG").unwrap_or("info".to_string());
    env::set_var("RUST_LOG", log_level);
    tracing_subscriber::fmt::init();
    dotenv().ok();

    let database_url = &env::var("DATABASE_URL").expect("undefined [DATABASE_URL]");
    let (tx, rx) = tokio::sync::oneshot::channel::<()>();
    tracing::debug!("start connect database...");
    let pool = PgPool::connect(database_url)
        .await
        .expect(&format!("fail connect database, url is {}", database_url));
    let repository = TodoRepositoryForDB::new(pool.clone());
    let app = create_app(
        TodoRepositoryForDB::new(pool.clone()),
        LabelRepositoryforDB::new(pool.clone()),
    );
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::debug!("listening on {}", addr);

    let graceful = axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .with_graceful_shutdown(async {
            rx.await.ok();
        });
    // close resource connection
    if let Err(e) = graceful.await {
        eprintln!("server error: {e}");
        pool.close().await;
    }

    let _ = tx.send(());
}

fn create_app<Todo: TodoRepository, Label: LabelRepository>(
    todo_repository: Todo,
    label_repository: Label,
) -> Router {
    Router::new()
        .route("/", get(root))
        .route("/todos", post(create_todo::<Todo>).get(all_todo::<Todo>))
        .route(
            "/todos/:id",
            get(find_todo::<Todo>)
                .delete(delete_todo::<Todo>)
                .patch(update_todo::<Todo>),
        )
        //add new router path is "/labels", and use post method to create label and get method to get all labels
        .route(
            "/labels",
            post(create_label::<Label>).get(all_label::<Label>),
        )
        .route("/labels/:id", delete(delete_label::<Label>))
        .layer(Extension(Arc::new(todo_repository)))
        .layer(Extension(Arc::new(label_repository)))
        .layer(
            CorsLayer::new()
                .allow_origin("http://localhost:3001".parse::<HeaderValue>().unwrap())
                .allow_methods(Any)
                .allow_headers(vec![CONTENT_TYPE]),
        )
}

async fn root() -> &'static str {
    "Hello, World"
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::handlers::label;
    use crate::repositories::label::test_utils::LabelRepositoryforMemory;
    use crate::repositories::label::Label;
    use crate::repositories::todo::{test_utils::TodoRepositoryForMemory, CreateTodo, TodoEntity};
    use axum::body::{self, Bytes};
    use axum::response::Response;
    use axum::{
        body::Body,
        http::{header, Method, Request, StatusCode},
    };
    use tower::ServiceExt;

    fn build_todo_req_with_json(path: &str, method: Method, json_body: String) -> Request<Body> {
        Request::builder()
            .uri(path)
            .method(method)
            .header(header::CONTENT_TYPE, mime::APPLICATION_JSON.as_ref())
            .body(Body::from(json_body))
            .unwrap()
    }

    fn build_todo_req_with_empty(method: Method, path: &str) -> Request<Body> {
        Request::builder()
            .uri(path)
            .method(method)
            .body(Body::empty())
            .unwrap()
    }

    async fn res_to_todo(res: Response) -> TodoEntity {
        let bytes = hyper::body::to_bytes(res.into_body()).await.unwrap();
        let body: String = String::from_utf8(bytes.to_vec()).unwrap();
        let todo: TodoEntity = serde_json::from_str(&body)
            .expect(&format!("cannot convert Todo instance. body: {}", body));
        todo
    }

    fn label_fixture() -> (Vec<Label>, Vec<i32>) {
        let id = 999;
        (
            vec![Label {
                id,
                name: String::from("test label"),
            }],
            vec![id],
        )
    }

    #[tokio::test]
    async fn should_created_todo() {
        let (labels, _label_ids) = label_fixture();
        let expected = TodoEntity::new(1, "should_return_created_todo".to_string(), labels.clone());

        let todo_repository = TodoRepositoryForMemory::new(labels.clone());
        let label_repository = LabelRepositoryforMemory::new();
        let req = build_todo_req_with_json(
            "/todos",
            Method::POST,
            r#"{ "text": "should_return_created_todo", "labels": [999]}"#.to_string(),
        );
        let res = create_app(todo_repository, label_repository)
            .oneshot(req)
            .await
            .unwrap();
        let todo = res_to_todo(res).await;
        assert_eq!(expected, todo);
    }

    #[tokio::test]
    async fn should_find_todo() {
        let (labels, label_ids) = label_fixture();
        let expected = TodoEntity::new(1, "should_find_todo".to_string(), labels.clone());
        let todo_repository = TodoRepositoryForMemory::new(labels.clone());
        let label_repository = LabelRepositoryforMemory::new();
        todo_repository
            .create(CreateTodo::new("should_find_todo".to_string(), label_ids))
            .await
            .expect("failed create todo");
        let req = build_todo_req_with_empty(Method::GET, "/todos/1");
        let res = create_app(todo_repository, label_repository)
            .oneshot(req)
            .await
            .unwrap();
        let todo = res_to_todo(res).await;
        assert_eq!(expected, todo);
    }

    #[tokio::test]
    async fn should_find_all_todo() {
        let (labels, label_ids) = label_fixture();
        let expected = TodoEntity::new(1, "should_find_all_todos".to_string(), labels.clone());
        let todo_repository = TodoRepositoryForMemory::new(labels.clone());
        let label_repository = LabelRepositoryforMemory::new();
        todo_repository
            .create(CreateTodo::new("should_find_all_todos".to_string(), label_ids))
            .await
            .expect("failed create todo");
        let req = build_todo_req_with_empty(Method::GET, "/todos");
        let res = create_app(todo_repository, label_repository)
            .oneshot(req)
            .await
            .unwrap();
        let bytes = hyper::body::to_bytes(res.into_body()).await.unwrap();
        let body: String = String::from_utf8(bytes.to_vec()).unwrap();
        let todos: Vec<TodoEntity> = serde_json::from_str(&body)
            .expect(&format!("cannot convert Todo instance. body: {}", body));
        assert_eq!(vec![expected], todos);
    }

    #[tokio::test]
    async fn should_update_todo() {
        let (labels, label_ids) = label_fixture();
        let expected = TodoEntity::new(1, "should_updated_todo".to_string(), labels.clone());
        let todo_repository = TodoRepositoryForMemory::new(labels.clone());
        let label_repository = LabelRepositoryforMemory::new();
        todo_repository
            .create(CreateTodo::new("should_find_todo".to_string(), label_ids))
            .await
            .expect("failed create todo");
        let req = build_todo_req_with_json(
            "/todos/1",
            Method::PATCH,
            r#"{
                "id": 1,
                "text": "should_updated_todo",
                "completed": false
            }"#
            .to_string(),
        );
        let res = create_app(todo_repository, label_repository)
            .oneshot(req)
            .await
            .unwrap();
        let todo = res_to_todo(res).await;
        assert_eq!(expected, todo);
    }

    #[tokio::test]
    async fn should_delete_todo() {
        let (labels, label_ids) = label_fixture();
        let todo_repository = TodoRepositoryForMemory::new(labels.clone());
        let label_repository = LabelRepositoryforMemory::new();
        todo_repository
            .create(CreateTodo::new("should_find_todo".to_string(), label_ids))
            .await
            .expect("failed create todo");
        let req = build_todo_req_with_empty(Method::DELETE, "/todos/1");

        let res = create_app(todo_repository, label_repository)
            .oneshot(req)
            .await
            .unwrap();
        assert_eq!(StatusCode::NO_CONTENT, res.status());
    }
}
