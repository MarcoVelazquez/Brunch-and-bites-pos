import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";



export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const router = useRouter();


  type Usuario = { nombre: string; contraseña: string };
  const usuarios: Usuario[] = [
  { nombre: "Ana", contraseña: "sexo anal" },
  { nombre: "Luis", contraseña: "sexo nasal" },
];

const verificarCredenciales = (usuario: string, contrasena: string): boolean => {
  const usuarioEncontrado = usuarios.find(
    (user) => user.nombre === usuario && user.contraseña === contrasena
  );
  return !!usuarioEncontrado;
};

const handleLogin = () => {
  if (usuario === "" || contrasena === "") {
    Alert.alert("Error", "Por favor ingresa usuario y contraseña");
  } else if (!verificarCredenciales(usuario, contrasena)) {
    Alert.alert("Error", "Usuario o contraseña incorrectos");
  } else {
    Alert.alert("Bienvenido", `Hola, ${usuario}`);
    router.push("/caja");
  }
};

  return (
    <View style={styles.root}>
      <View style={styles.centered}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
        />
        <Text style={styles.headerTitle}>Iniciar sesión</Text>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Usuario</Text>
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
          />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
          />
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#e6f0fa",
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    alignItems: "center",
    width: "100%",
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#fff",
    resizeMode: "contain",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
  },
  formContainer: {
    width: 320,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  loginBtn: {
    backgroundColor: "#38b24d",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});