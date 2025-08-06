<?php
session_start();

// Recebe dados do formulário
$nome = $_POST['nome'] ?? '';
$email = $_POST['email'] ?? '';
$telefone = $_POST['telefone'] ?? '';
$senha = $_POST['senha'] ?? '';
$confirmarSenha = $_POST['confirmarSenha'] ?? '';

// Validações básicas
if (!$nome || !$email || !$senha || !$confirmarSenha) {
    header("Location: ../cadastro.html?erro=campos");
    exit();
}

if ($senha !== $confirmarSenha) {
    header("Location: ../cadastro.html?erro=senhas");
    exit();
}

// Aqui conecte ao banco e insira usuário
// Exemplo simples (NÃO usar senhas em texto puro na prática)
$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

// Suponha que você salve no banco aqui (exemplo):
// saveUser($nome, $email, $telefone, $senhaHash);

// Após cadastro, redirecione para login ou já logue o usuário:
$_SESSION['usuario'] = $email;
header("Location: ../index.html");
exit();
?>
